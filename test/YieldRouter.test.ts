import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("YieldRouter", function () {
  async function deployYieldRouterFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [owner, recipient1, recipient2, other] = await hre.ethers.getSigners();

    // Deploy mock asset
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
    await asset.mint(owner.address, 10_000_000n * 10n ** 6n);

    // Deploy FixedAllocationMechanism with 2 recipients [60%, 40%]
    const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
    const mechanism = await FAMFactory.deploy(
      owner.address,
      [recipient1.address, recipient2.address],
      [6000n, 4000n]
    );

    const client = await hre.cofhe.createClientWithBatteries(owner);
    const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();

    // Deploy vault (signer acts as the vault — the router only checks vault address)
    const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
    const vault = await VaultFactory.connect(owner).deploy(
      await asset.getAddress(),
      "Test Vault",
      "TV",
      owner.address,
      owner.address, // keeper = owner
      owner.address, // emergencyAdmin = owner
      recipient1.address,
      encFee[0]
    );

    // Deploy registry
    const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
    const registry = await RegistryFactory.connect(owner).deploy(
      await vault.getAddress(),
      owner.address,
      10,
      owner.address
    );

    // Deploy YieldRouter with the vault address
    const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
    const yieldRouter = await YieldRouterFactory.deploy(
      await vault.getAddress(),
      await mechanism.getAddress()
    );

    // Initialize vault with yieldRouter
    await vault.connect(owner).initialize(
      await registry.getAddress(),
      await yieldRouter.getAddress(),
      owner.address // rebalancer
    );

    return { vault, yieldRouter, mechanism, asset, owner, recipient1, recipient2, other };
  }

  describe("routeYield", function () {
    it("should split yield according to weights when called from vault", async function () {
      const { vault, yieldRouter, asset, owner, recipient1, recipient2 } =
        await loadFixture(deployYieldRouterFixture);

      // Deposit to vault first so it has shares
      const DEPOSIT = 1000n * 10n ** 6n;
      await asset.connect(owner).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(owner).deposit(DEPOSIT, owner.address);

      // Manually mint shares to yieldRouter (simulate what report() does)
      // The vault has an approve of yieldRouter, but we need to test routeYield directly
      // We'll do it by having owner (= keeper) call routeYield indirectly via report
      // Setup: deploy a mock strategy that will generate profit
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const client = await hre.cofhe.createClientWithBatteries(owner);
      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await (await hre.ethers.getContractAt("EncryptedStrategyRegistry", await vault.registry())).connect(owner).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(owner).addStrategy(await strategy.getAddress());

      await vault.connect(owner).deployToStrategy(await strategy.getAddress(), DEPOSIT);

      // Set profit
      const PROFIT = 1000n * 10n ** 6n;
      await strategy.setMockTotalAssets(DEPOSIT + PROFIT);

      // Report triggers routeYield
      await vault.connect(owner).report(await strategy.getAddress());

      const epoch = await yieldRouter.currentEpoch();
      const claimable1 = await yieldRouter.claimableFor(recipient1.address, epoch);
      const claimable2 = await yieldRouter.claimableFor(recipient2.address, epoch);

      // Both should have received some shares
      expect(claimable1).to.be.gt(0n);
      expect(claimable2).to.be.gt(0n);

      // Weights are 60/40, so recipient1 gets 60% of shares
      const total = claimable1 + claimable2;
      // Check approximately 60% / 40% split (with rounding)
      expect(claimable1 * 10n).to.be.gte(total * 5n); // at least 50%
      expect(claimable1 * 10n).to.be.lte(total * 7n); // at most 70%
    });

    it("should revert routeYield when called by non-vault", async function () {
      const { yieldRouter, other } = await loadFixture(deployYieldRouterFixture);

      await expect(
        yieldRouter.connect(other).routeYield(1000n)
      ).to.be.revertedWith("YR: not vault");
    });
  });

  describe("claim", function () {
    it("should transfer claimable shares to recipient on claim", async function () {
      const { vault, yieldRouter, asset, owner, recipient1, recipient2 } =
        await loadFixture(deployYieldRouterFixture);

      // Setup deposit and profit to generate claimable shares
      const DEPOSIT = 1000n * 10n ** 6n;
      await asset.connect(owner).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(owner).deposit(DEPOSIT, owner.address);

      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const client = await hre.cofhe.createClientWithBatteries(owner);
      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await (await hre.ethers.getContractAt("EncryptedStrategyRegistry", await vault.registry())).connect(owner).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(owner).addStrategy(await strategy.getAddress());
      await vault.connect(owner).deployToStrategy(await strategy.getAddress(), DEPOSIT);
      await strategy.setMockTotalAssets(DEPOSIT + 1000n * 10n ** 6n);
      await vault.connect(owner).report(await strategy.getAddress());

      const epoch = await yieldRouter.currentEpoch();
      const claimableShares = await yieldRouter.claimableFor(recipient1.address, epoch);
      expect(claimableShares).to.be.gt(0n);

      const balanceBefore = await vault.balanceOf(recipient1.address);
      await yieldRouter.connect(recipient1).claim(epoch);
      const balanceAfter = await vault.balanceOf(recipient1.address);

      expect(balanceAfter - balanceBefore).to.equal(claimableShares);
    });

    it("should revert claim when nothing to claim", async function () {
      const { yieldRouter, other } = await loadFixture(deployYieldRouterFixture);

      await expect(
        yieldRouter.connect(other).claim(0n)
      ).to.be.revertedWith("YR: nothing to claim");
    });
  });
});
