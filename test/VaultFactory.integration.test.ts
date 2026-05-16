import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

// NOTE: VaultFactory.createVault() calls vault.initialize() with msg.sender = factory,
// but vault.initialize() requires msg.sender == vault.owner (the creator).
// This is a design inconsistency in the contracts. The integration tests below
// test the factory components individually and show a manual end-to-end flow
// where the owner calls initialize after the factory deploys sub-components.

describe("VaultFactory Integration", function () {
  async function deployFactoryFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [deployer, keeper, emergencyAdmin, recipient, user] =
      await hre.ethers.getSigners();

    // Disable verifier signer check so encrypted inputs work when passed
    // through factory boundaries (msg.sender changes between contract calls)
    const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
    const taskManager = await hre.ethers.getContractAt(
      ["function setVerifierSigner(address signer) external"],
      TASK_MANAGER_ADDRESS
    );
    await taskManager.connect(deployer).setVerifierSigner(hre.ethers.ZeroAddress);

    // Deploy mock asset
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
    await asset.mint(user.address, 10_000_000n * 10n ** 6n);
    await asset.mint(deployer.address, 10_000_000n * 10n ** 6n);

    // Deploy VaultRegistry
    const VaultRegistryFactory = await hre.ethers.getContractFactory("VaultRegistry");
    const vaultRegistry = await VaultRegistryFactory.connect(deployer).deploy();

    // Deploy AllocationMechanismFactory
    const AMFFactory = await hre.ethers.getContractFactory("AllocationMechanismFactory");
    const allocationMechanismFactory = await AMFFactory.connect(deployer).deploy();

    // Deploy VaultFactory
    const VaultFactoryFactory = await hre.ethers.getContractFactory("VaultFactory");
    const vaultFactory = await VaultFactoryFactory.connect(deployer).deploy(
      await vaultRegistry.getAddress(),
      await allocationMechanismFactory.getAddress()
    );

    // Set factory in registry
    await vaultRegistry.connect(deployer).setFactory(await vaultFactory.getAddress());

    // Create encrypted params
    const client = await hre.cofhe.createClientWithBatteries(deployer);
    const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
    const encDrift = await client.encryptInputs([Encryptable.uint16(500n)]).execute();
    const encMinTime = await client.encryptInputs([Encryptable.uint32(86400n)]).execute();

    return {
      vaultRegistry,
      allocationMechanismFactory,
      vaultFactory,
      asset,
      deployer,
      keeper,
      emergencyAdmin,
      recipient,
      user,
      client,
      encFee,
      encDrift,
      encMinTime,
    };
  }

  describe("VaultRegistry", function () {
    it("setFactory reverts if called twice", async function () {
      const { vaultRegistry, deployer } = await loadFixture(deployFactoryFixture);

      await expect(
        vaultRegistry.connect(deployer).setFactory(deployer.address)
      ).to.be.revertedWith("VaultRegistry: factory already set");
    });

    it("register reverts if called by non-factory", async function () {
      const { vaultRegistry, deployer } = await loadFixture(deployFactoryFixture);

      await expect(
        vaultRegistry.connect(deployer).register(
          deployer.address,
          deployer.address,
          "V",
          "V",
          deployer.address
        )
      ).to.be.revertedWith("VaultRegistry: not factory");
    });

    it("vaultRegistry links to vaultFactory correctly", async function () {
      const { vaultRegistry, vaultFactory } = await loadFixture(deployFactoryFixture);

      expect(await vaultRegistry.factory()).to.equal(await vaultFactory.getAddress());
      expect(await vaultRegistry.factorySet()).to.be.true;
    });
  });

  describe("Manual end-to-end vault creation (owner calls initialize)", function () {
    it("should create a full vault manually with all components linked", async function () {
      const {
        vaultFactory,
        vaultRegistry,
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        user,
        client,
      } = await loadFixture(deployFactoryFixture);

      // Since VaultFactory.createVault calls vault.initialize() as the factory (not owner),
      // and vault.initialize() requires msg.sender == vault.owner,
      // we test the manual flow instead where owner initializes after deployment.

      // Step 1: Deploy vault manually (owner = deployer)
      const encFee2 = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory2 = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory2.connect(deployer).deploy(
        await asset.getAddress(),
        "Manual Vault",
        "MV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee2[0]
      );

      // Step 2: Deploy registry (vault = vault address, owner = deployer)
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Step 3: Deploy fixed allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Step 4: Deploy yield router
      const YRFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YRFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Step 5: Deploy rebalancer
      const PRFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await PRFactory.connect(deployer).deploy(deployer.address);

      // Step 6: Configure rebalancer
      const encDrift2 = await client.encryptInputs([Encryptable.uint16(500n)]).execute();
      const encMinTime2 = await client.encryptInputs([Encryptable.uint32(86400n)]).execute();
      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        encDrift2[0],
        encMinTime2[0]
      );

      // Step 7: Owner initializes vault (msg.sender == vault.owner = deployer)
      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Verify all components are linked
      expect(await vault.registry()).to.equal(await registry.getAddress());
      expect(await vault.yieldRouter()).to.equal(await yieldRouter.getAddress());
      expect(await vault.rebalancer()).to.equal(await rebalancer.getAddress());

      // Step 8: Register in vault registry (using the factory)
      // (In practice, VaultFactory would call registry.register — here we show it works)
      // We can't call register directly since only factory can. But we can verify
      // registry has vaultFactory as factory.
      expect(await vaultRegistry.factory()).to.equal(await vaultFactory.getAddress());

      // Step 9: Deposit 1000 tokens
      const DEPOSIT = 1000n * 10n ** 6n;
      await asset.connect(user).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(user).deposit(DEPOSIT, user.address);

      expect(await vault.totalPrincipal()).to.equal(DEPOSIT);
      expect(await vault.balanceOf(user.address)).to.equal(DEPOSIT);
    });

    it("vault.initialize reverts when called again after setup", async function () {
      const { asset, deployer, keeper, emergencyAdmin, recipient, client } =
        await loadFixture(deployFactoryFixture);

      const encFee2 = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory2 = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory2.connect(deployer).deploy(
        await asset.getAddress(),
        "Test Vault",
        "TV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee2[0]
      );

      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.deploy(deployer.address, [recipient.address], [10000n]);

      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(), deployer.address, 10, deployer.address
      );

      const YRFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YRFactory.deploy(
        await vault.getAddress(), await mechanism.getAddress()
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        deployer.address
      );

      // Second call should revert
      await expect(
        vault.connect(deployer).initialize(
          await registry.getAddress(),
          await yieldRouter.getAddress(),
          deployer.address
        )
      ).to.be.revertedWith("PCV: already initialized");
    });
  });

  describe("AllocationMechanismFactory", function () {
    it("createFixed deploys FixedAllocationMechanism correctly", async function () {
      const { allocationMechanismFactory, deployer, recipient } =
        await loadFixture(deployFactoryFixture);

      const mechAddr = await allocationMechanismFactory.connect(deployer).createFixed.staticCall(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      await allocationMechanismFactory.connect(deployer).createFixed(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      const mech = await hre.ethers.getContractAt("FixedAllocationMechanism", mechAddr);
      expect(await mech.totalWeight()).to.equal(10000n);
      const [recipients, weights] = await mech.getRecipients();
      expect(recipients[0]).to.equal(recipient.address);
      expect(weights[0]).to.equal(10000n);
    });
  });
});
