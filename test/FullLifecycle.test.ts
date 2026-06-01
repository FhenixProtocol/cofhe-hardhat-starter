/**
 * Full Lifecycle Integration Test
 * 
 * Tests the complete lifecycle of the CoFHE Private Composable Vault system:
 * 1. Vault deployment and initialization
 * 2. Strategy registration and management
 * 3. Deposits and share minting
 * 4. Strategy deployment and yield generation
 * 5. Keeper reporting and yield routing
 * 6. Encrypted rebalancing decisions
 * 7. Withdrawal with loss handling
 * 8. Emergency pause/resume operations
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("Full Lifecycle Integration Tests", function () {
  async function deployFullLifecycleFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [deployer, keeper, emergencyAdmin, recipient, user1, user2, user3, strategist] =
      await hre.ethers.getSigners();

    // Deploy mock ERC20 asset (6 decimals like USDC)
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
    
    // Mint tokens
    const TEN_MILLION = 10_000_000n * 10n ** 6n;
    await asset.mint(user1.address, TEN_MILLION);
    await asset.mint(user2.address, TEN_MILLION);
    await asset.mint(user3.address, TEN_MILLION);
    await asset.mint(deployer.address, TEN_MILLION);

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

    // Disable verifier signer check for cross-contract encrypted inputs
    const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
    const taskManager = await hre.ethers.getContractAt(
      ["function setVerifierSigner(address signer) external"],
      TASK_MANAGER_ADDRESS
    );
    await taskManager.connect(deployer).setVerifierSigner(hre.ethers.ZeroAddress);

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
      user1,
      user2,
      user3,
      strategist,
      client,
      encFee,
      encDrift,
      encMinTime,
    };
  }

  describe("Phase 1: Vault Deployment", function () {
    // NOTE: VaultFactory.createVault() calls vault.initialize() with msg.sender = factory,
    // but vault.initialize() requires msg.sender == vault.owner. This is a design 
    // inconsistency - only testing manual deployment flow here.
    it("should deploy complete vault infrastructure manually", async function () {
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = await loadFixture(deployFullLifecycleFixture);

      // Deploy vault manually (owner = deployer)
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Full Lifecycle Vault",
        "FLV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      // Configure rebalancer
      const encDrift = await client.encryptInputs([Encryptable.uint16(500n)]).execute();
      const encMinTime = await client.encryptInputs([Encryptable.uint32(86400n)]).execute();
      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        encDrift[0],
        encMinTime[0]
      );

      // Initialize vault (msg.sender = deployer = vault.owner)
      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Verify vault configuration
      expect(await vault.owner()).to.equal(deployer.address);
      expect(await vault.keeper()).to.equal(keeper.address);
      expect(await vault.emergencyAdmin()).to.equal(emergencyAdmin.address);
      expect(await vault.depositsPaused()).to.be.false;
      expect(await vault.withdrawalsPaused()).to.be.false;

      // Verify all components linked
      expect(await vault.registry()).to.equal(await registry.getAddress());
      expect(await vault.yieldRouter()).to.equal(await yieldRouter.getAddress());
      expect(await vault.rebalancer()).to.equal(await rebalancer.getAddress());

      // Verify rebalancer configuration
      expect(await rebalancer.isConfigured(await vault.getAddress())).to.be.true;
    });

    it("should allow manual vault deployment with all components", async function () {
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = await loadFixture(deployFullLifecycleFixture);

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(150n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Manual Vault",
        "MV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy fixed allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      // Configure rebalancer
      const encDrift = await client.encryptInputs([Encryptable.uint16(400n)]).execute();
      const encMinTime = await client.encryptInputs([Encryptable.uint32(43200n)]).execute();
      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        encDrift[0],
        encMinTime[0]
      );

      // Initialize vault
      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Verify initialization
      expect(await vault.registry()).to.equal(await registry.getAddress());
      expect(await vault.yieldRouter()).to.equal(await yieldRouter.getAddress());
      expect(await vault.rebalancer()).to.equal(await rebalancer.getAddress());

      // Verify rebalancer configuration
      expect(await rebalancer.isConfigured(await vault.getAddress())).to.be.true;
    });
  });

  describe("Phase 2: Strategy Registration", function () {
    async function setupVaultWithStrategies() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Strategy Vault",
        "SV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      // Configure rebalancer
      const encDrift = await client.encryptInputs([Encryptable.uint16(500n)]).execute();
      const encMinTime = await client.encryptInputs([Encryptable.uint32(86400n)]).execute();
      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        encDrift[0],
        encMinTime[0]
      );

      // Initialize vault
      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Deploy mock strategies
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategies: any[] = [];

      for (let i = 0; i < 3; i++) {
        const strategy = await MockStrategyFactory.connect(deployer).deploy(
          await asset.getAddress(),
          await vault.getAddress()
        );
        strategies.push(strategy);

        // Add to registry and vault
        const encWeight = await client.encryptInputs([Encryptable.uint16(3333n)]).execute();
        await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
        await vault.connect(deployer).addStrategy(await strategy.getAddress());
      }

      // Set rebalancer in registry
      await registry.connect(deployer).setRebalancer(await rebalancer.getAddress());

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer, strategies };
    }

    it("should register strategies with encrypted weights", async function () {
      const { registry, deployer } = await setupVaultWithStrategies();

      expect(await registry.strategyCount()).to.equal(3n);

      // Verify all strategy addresses are retrievable
      for (let i = 0; i < 3; i++) {
        const addr = await registry.getStrategyAddress(i);
        expect(addr).to.not.equal(hre.ethers.ZeroAddress);
        expect(await registry.isStrategyRegistered(addr)).to.be.true;
      }

      // Verify weight sum equals 9999 (3333 * 3)
      const weightSumHandle = await registry.connect(deployer).getWeightSum.staticCall();
      await registry.connect(deployer).getWeightSum();
      const weightSum = await hre.cofhe.mocks.getPlaintext(weightSumHandle);
      expect(weightSum).to.equal(9999n); // 3333 * 3 = 9999
    });

    it("should update strategy weights correctly", async function () {
      const { registry, deployer, client } = await setupVaultWithStrategies();

      const strategyAddr = await registry.getStrategyAddress(0);

      // Get original weight
      const originalHandle = await registry.connect(deployer).getWeight.staticCall(strategyAddr);
      await registry.connect(deployer).getWeight(strategyAddr);
      const originalWeight = await hre.cofhe.mocks.getPlaintext(originalHandle);
      expect(originalWeight).to.equal(3333n);

      // Update weight
      const newWeight = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(deployer).updateWeight(strategyAddr, newWeight[0]);

      // Verify new weight
      const newHandle = await registry.connect(deployer).getWeight.staticCall(strategyAddr);
      await registry.connect(deployer).getWeight(strategyAddr);
      const updatedWeight = await hre.cofhe.mocks.getPlaintext(newHandle);
      expect(updatedWeight).to.equal(5000n);

      // Verify weight sum updated
      const sumHandle = await registry.connect(deployer).getWeightSum.staticCall();
      await registry.connect(deployer).getWeightSum();
      const sum = await hre.cofhe.mocks.getPlaintext(sumHandle);
      expect(sum).to.equal(11666n); // 5000 + 3333 + 3333
    });

    it("should remove strategy and update weights", async function () {
      const { registry, deployer, client } = await setupVaultWithStrategies();

      const strategyToRemove = await registry.getStrategyAddress(0);
      const initialCount = await registry.strategyCount();

      // Remove strategy
      await registry.connect(deployer).removeStrategy(strategyToRemove);

      // Strategy count doesn't change (marked inactive, not removed)
      expect(await registry.strategyCount()).to.equal(initialCount);

      // Verify strategy is still registered but inactive
      const strategyStillInVault = await registry.isStrategyRegistered(strategyToRemove);
      expect(strategyStillInVault).to.be.true; // Still in registry, just inactive

      // Verify active flag is false
      const activeHandle = await registry.connect(deployer).getActive.staticCall(strategyToRemove);
      await registry.connect(deployer).getActive(strategyToRemove);
      const isActive = await hre.cofhe.mocks.getPlaintext(activeHandle);
      expect(isActive).to.equal(0n); // false

      // Verify weight sum decreased
      const sumHandle = await registry.connect(deployer).getWeightSum.staticCall();
      await registry.connect(deployer).getWeightSum();
      const sum = await hre.cofhe.mocks.getPlaintext(sumHandle);
      expect(sum).to.equal(6666n); // 3333 + 3333 (removed 3333)
    });
  });

  describe("Phase 3: Deposits and Share Minting", function () {
    async function setupVaultForDeposits() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Deposit Vault",
        "DV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        (await client.encryptInputs([Encryptable.uint16(500n)])).execute()[0],
        (await client.encryptInputs([Encryptable.uint32(86400n)])).execute()[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Deploy strategy
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.connect(deployer).deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(deployer).addStrategy(await strategy.getAddress());

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer, strategy };
    }

    it("should mint shares 1:1 on first deposit", async function () {
      const { vault, asset, user1 } = await setupVaultForDeposits();

      const depositAmount = 10000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      
      const shares = await vault.connect(user1).deposit.staticCall(depositAmount, user1.address);
      expect(shares).to.equal(depositAmount);

      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
      expect(await vault.totalPrincipal()).to.equal(depositAmount);
    });

    it("should handle multiple user deposits", async function () {
      const { vault, asset, user1, user2, user3 } = await setupVaultForDeposits();

      const deposit1 = 5000n * 10n ** 6n;
      const deposit2 = 8000n * 10n ** 6n;
      const deposit3 = 12000n * 10n ** 6n;

      await asset.connect(user1).approve(await vault.getAddress(), deposit1);
      await vault.connect(user1).deposit(deposit1, user1.address);

      await asset.connect(user2).approve(await vault.getAddress(), deposit2);
      await vault.connect(user2).deposit(deposit2, user2.address);

      await asset.connect(user3).approve(await vault.getAddress(), deposit3);
      await vault.connect(user3).deposit(deposit3, user3.address);

      expect(await vault.balanceOf(user1.address)).to.equal(deposit1);
      expect(await vault.balanceOf(user2.address)).to.equal(deposit2);
      expect(await vault.balanceOf(user3.address)).to.equal(deposit3);
      expect(await vault.totalAssets()).to.equal(deposit1 + deposit2 + deposit3);
    });

    it("should revert deposits when paused", async function () {
      const { vault, asset, deployer, user1 } = await setupVaultForDeposits();

      await vault.connect(deployer).pauseDeposits();

      const depositAmount = 1000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);

      await expect(
        vault.connect(user1).deposit(depositAmount, user1.address)
      ).to.be.revertedWith("PCV: deposits paused");

      // Unpause and try again
      await vault.connect(deployer).unpauseDeposits();

      await vault.connect(user1).deposit(depositAmount, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
    });
  });

  describe("Phase 4: Strategy Deployment and Yield", function () {
    async function setupForStrategyDeployment() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        user1,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Yield Vault",
        "YV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        (await client.encryptInputs([Encryptable.uint16(500n)])).execute()[0],
        (await client.encryptInputs([Encryptable.uint32(86400n)])).execute()[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Deploy strategy
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.connect(deployer).deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(deployer).addStrategy(await strategy.getAddress());

      // User deposits
      const depositAmount = 50000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer, strategy, user1 };
    }

    it("should deploy funds to strategy", async function () {
      const { vault, strategy, keeper, asset } = await setupForStrategyDeployment();

      const deployAmount = 30000n * 10n ** 6n;
      
      // Check vault has sufficient cash
      const vaultCashBefore = await asset.balanceOf(await vault.getAddress());
      expect(vaultCashBefore).to.be.gte(deployAmount);

      // Deploy to strategy
      await vault.connect(keeper).deployToStrategy(await strategy.getAddress(), deployAmount);

      // Verify strategy received funds
      const strategyBalance = await asset.balanceOf(await strategy.getAddress());
      expect(strategyBalance).to.equal(deployAmount);
    });

    it("should report profit and mint donation shares", async function () {
      const { vault, strategy, yieldRouter, keeper } = await setupForStrategyDeployment();

      const deployAmount = 30000n * 10n ** 6n;
      await vault.connect(keeper).deployToStrategy(await strategy.getAddress(), deployAmount);

      // Simulate profit (strategy reports more assets)
      const profit = 1000n * 10n ** 6n;
      await strategy.setMockTotalAssets(deployAmount + profit);

      // Check yield router balance before
      const yieldRouterSharesBefore = await vault.balanceOf(await yieldRouter.getAddress());
      expect(yieldRouterSharesBefore).to.equal(0n);

      // Report
      await vault.connect(keeper).report(await strategy.getAddress());

      // Verify donation shares minted to yield router
      const yieldRouterSharesAfter = await vault.balanceOf(await yieldRouter.getAddress());
      expect(yieldRouterSharesAfter).to.be.gt(0n);
    });

    it("should handle loss by burning donation shares", async function () {
      const { vault, strategy, yieldRouter, keeper } = await setupForStrategyDeployment();

      const deployAmount = 30000n * 10n ** 6n;
      await vault.connect(keeper).deployToStrategy(await strategy.getAddress(), deployAmount);

      // Generate profit first (to create donation buffer)
      const profit = 2000n * 10n ** 6n;
      await strategy.setMockTotalAssets(deployAmount + profit);
      await vault.connect(keeper).report(await strategy.getAddress());

      const donationSharesBefore = await vault.balanceOf(await yieldRouter.getAddress());
      expect(donationSharesBefore).to.be.gt(0n);

      // Now simulate loss
      const loss = 500n * 10n ** 6n;
      await strategy.setMockTotalAssets(deployAmount + profit - loss);
      await vault.connect(keeper).report(await strategy.getAddress());

      // Donation shares should have decreased
      const donationSharesAfter = await vault.balanceOf(await yieldRouter.getAddress());
      expect(donationSharesAfter).to.be.lt(donationSharesBefore);
    });

    it("should handle large loss exceeding donation buffer", async function () {
      const { vault, strategy, yieldRouter, keeper } = await setupForStrategyDeployment();

      const deployAmount = 30000n * 10n ** 6n;
      await vault.connect(keeper).deployToStrategy(await strategy.getAddress(), deployAmount);

      // Generate small profit first
      const profit = 500n * 10n ** 6n;
      await strategy.setMockTotalAssets(deployAmount + profit);
      await vault.connect(keeper).report(await strategy.getAddress());

      const donationSharesBefore = await vault.balanceOf(await yieldRouter.getAddress());

      // Simulate large loss
      const loss = 5000n * 10n ** 6n;
      await strategy.setMockTotalAssets(deployAmount + profit - loss);
      await vault.connect(keeper).report(await strategy.getAddress());

      // All donation shares should be burned
      const donationSharesAfter = await vault.balanceOf(await yieldRouter.getAddress());
      expect(donationSharesAfter).to.equal(0n);
    });
  });

  describe("Phase 5: Encrypted Rebalancing", function () {
    async function setupForRebalancing() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Rebalance Vault",
        "RV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      // Configure rebalancer with low threshold for testing
      const encDrift = await client.encryptInputs([Encryptable.uint16(100n)]).execute();
      const encMinTime = await client.encryptInputs([Encryptable.uint32(0n)]).execute(); // 0 = always can rebalance
      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        encDrift[0],
        encMinTime[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Deploy multiple strategies
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategies: any[] = [];
      const weights = [5000n, 3000n, 2000n];

      for (let i = 0; i < 3; i++) {
        const strategy = await MockStrategyFactory.connect(deployer).deploy(
          await asset.getAddress(),
          await vault.getAddress()
        );
        strategies.push(strategy);

        const encWeight = await client.encryptInputs([Encryptable.uint16(weights[i])]).execute();
        await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
        await vault.connect(deployer).addStrategy(await strategy.getAddress());
      }

      // Set rebalancer in registry
      await registry.connect(deployer).setRebalancer(await rebalancer.getAddress());

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer, strategies };
    }

    it("should check rebalance decision encrypted", async function () {
      const { rebalancer, vault, deployer } = await setupForRebalancing();

      // Call checkRebalanceNeeded with high drift (should trigger rebalance)
      const tx = await rebalancer.connect(deployer).checkRebalanceNeeded(
        await vault.getAddress(),
        hre.ethers.ZeroAddress,
        200 // high drift
      );
      const receipt = await tx.wait();

      // Verify FHE operations occurred
      const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
      const taskManagerIface = new hre.ethers.Interface([
        "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
      ]);

      const taskEvents = receipt!.logs
        .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
        .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
        .filter(e => e !== null && e.name === "TaskCreated");

      expect(taskEvents.length).to.be.gt(5); // Multiple FHE operations

      // Find the 'or' result
      const orEvent = taskEvents.find(e => e!.args[1] === "or");
      expect(orEvent).to.not.be.undefined;

      const resultHandle = orEvent!.args[0];
      const result = await hre.cofhe.mocks.getPlaintext(resultHandle);
      expect(result).to.equal(1n); // true - rebalance needed
    });

    it("should trigger rebalance correctly", async function () {
      const { rebalancer, vault, strategies, deployer, asset } = await setupForRebalancing();

      // Deposit to vault
      const deposit = 100000n * 10n ** 6n;
      await asset.mint(deployer.address, deposit);
      await asset.connect(deployer).approve(await vault.getAddress(), deposit);
      await vault.connect(deployer).deposit(deposit, deployer.address);

      // Deploy to strategies
      for (let i = 0; i < strategies.length; i++) {
        const deployAmount = (deposit * 30n) / 100n; // 30% each
        await vault.connect(deployer).deployToStrategy(await strategies[i].getAddress(), deployAmount);
      }

      // Trigger rebalance
      const strategyAddrs = await Promise.all(strategies.map(s => s.getAddress()));
      await rebalancer.connect(deployer).triggerRebalance(
        await vault.getAddress(),
        hre.ethers.ZeroAddress,
        [strategyAddrs[0]],
        [1000n * 10n ** 6n],
        [true], // withdraw
        200 // drift
      );

      // Verify transaction completed
      // Note: In real scenario, vault would execute the rebalance
    });
  });

  describe("Phase 6: Withdrawal", function () {
    async function setupForWithdrawal() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        user1,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Withdraw Vault",
        "WV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy registry
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      // Deploy allocation mechanism
      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      // Deploy yield router
      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      // Deploy rebalancer
      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        (await client.encryptInputs([Encryptable.uint16(500n)])).execute()[0],
        (await client.encryptInputs([Encryptable.uint32(86400n)])).execute()[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // Deploy strategy
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.connect(deployer).deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(deployer).addStrategy(await strategy.getAddress());

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer, strategy };
    }

    it("should burn shares and return assets on withdraw", async function () {
      const { vault, asset, user1 } = await setupForWithdrawal();

      // User deposits
      const depositAmount = 10000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const userBalanceBefore = await vault.balanceOf(user1.address);
      const userAssetBalanceBefore = await asset.balanceOf(user1.address);

      // Withdraw partial amount
      const withdrawAmount = 5000n * 10n ** 6n;
      await vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);

      // Verify state
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount - withdrawAmount);
      expect(await vault.totalPrincipal()).to.equal(withdrawAmount); // Principal reduced

      const userAssetBalanceAfter = await asset.balanceOf(user1.address);
      expect(userAssetBalanceAfter - userAssetBalanceBefore).to.equal(withdrawAmount);
    });

    it("should revert withdrawal when paused", async function () {
      const { vault, asset, deployer, user1 } = await setupForWithdrawal();

      // User deposits
      const depositAmount = 10000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Pause withdrawals
      await vault.connect(deployer).pauseWithdrawals();

      // Try to withdraw
      await expect(
        vault.connect(user1).withdraw(5000n * 10n ** 6n, user1.address, user1.address)
      ).to.be.revertedWith("PCV: withdrawals paused");

      // Unpause and try again
      await vault.connect(deployer).unpauseWithdrawals();
      await vault.connect(user1).withdraw(5000n * 10n ** 6n, user1.address, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount - 5000n * 10n ** 6n);
    });

    it("should handle full withdrawal", async function () {
      const { vault, asset, user1 } = await setupForWithdrawal();

      const depositAmount = 10000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Full withdrawal
      await vault.connect(user1).withdraw(depositAmount, user1.address, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(0n);
      expect(await vault.totalPrincipal()).to.equal(0n);
    });
  });

  describe("Phase 7: Emergency Operations", function () {
    async function setupForEmergencyTests() {
      const fixture = await loadFixture(deployFullLifecycleFixture);
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        client,
      } = fixture;

      // Deploy vault manually
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Emergency Vault",
        "EV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // Deploy minimal infrastructure
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        (await client.encryptInputs([Encryptable.uint16(500n)])).execute()[0],
        (await client.encryptInputs([Encryptable.uint32(86400n)])).execute()[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      return { ...fixture, vault, registry, mechanism, yieldRouter, rebalancer };
    }

    it("owner should be able to pause deposits", async function () {
      const { vault, deployer } = await setupForEmergencyTests();

      expect(await vault.depositsPaused()).to.be.false;

      await vault.connect(deployer).pauseDeposits();

      expect(await vault.depositsPaused()).to.be.true;
    });

    it("emergency admin should be able to pause deposits", async function () {
      const { vault, emergencyAdmin } = await setupForEmergencyTests();

      await vault.connect(emergencyAdmin).pauseDeposits();

      expect(await vault.depositsPaused()).to.be.true;
    });

    it("keeper should NOT be able to pause deposits", async function () {
      const { vault, keeper } = await setupForEmergencyTests();

      await expect(
        vault.connect(keeper).pauseDeposits()
      ).to.be.reverted;
    });

    it("owner should be able to pause withdrawals", async function () {
      const { vault, deployer } = await setupForEmergencyTests();

      expect(await vault.withdrawalsPaused()).to.be.false;

      await vault.connect(deployer).pauseWithdrawals();

      expect(await vault.withdrawalsPaused()).to.be.true;
    });

    it("emergency admin should be able to pause withdrawals", async function () {
      const { vault, emergencyAdmin } = await setupForEmergencyTests();

      await vault.connect(emergencyAdmin).pauseWithdrawals();

      expect(await vault.withdrawalsPaused()).to.be.true;
    });

    it("should be able to unpause both", async function () {
      const { vault, deployer } = await setupForEmergencyTests();

      // Pause both
      await vault.connect(deployer).pauseDeposits();
      await vault.connect(deployer).pauseWithdrawals();

      expect(await vault.depositsPaused()).to.be.true;
      expect(await vault.withdrawalsPaused()).to.be.true;

      // Unpause both
      await vault.connect(deployer).unpauseDeposits();
      await vault.connect(deployer).unpauseWithdrawals();

      expect(await vault.depositsPaused()).to.be.false;
      expect(await vault.withdrawalsPaused()).to.be.false;
    });
  });

  describe("End-to-End Stress Test", function () {
    it("should handle complete lifecycle with multiple operations", async function () {
      const {
        asset,
        deployer,
        keeper,
        emergencyAdmin,
        recipient,
        user1,
        user2,
        client,
      } = await loadFixture(deployFullLifecycleFixture);

      // 1. Deploy vault
      const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();
      const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
      const vault = await VaultFactory.connect(deployer).deploy(
        await asset.getAddress(),
        "Stress Vault",
        "SV",
        deployer.address,
        keeper.address,
        emergencyAdmin.address,
        recipient.address,
        encFee[0]
      );

      // 2. Setup infrastructure
      const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
      const registry = await RegistryFactory.connect(deployer).deploy(
        await vault.getAddress(),
        deployer.address,
        10,
        deployer.address
      );

      const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
      const mechanism = await FAMFactory.connect(deployer).deploy(
        deployer.address,
        [recipient.address],
        [10000n]
      );

      const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
      const yieldRouter = await YieldRouterFactory.connect(deployer).deploy(
        await vault.getAddress(),
        await mechanism.getAddress()
      );

      const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
      const rebalancer = await RebalancerFactory.connect(deployer).deploy(deployer.address);

      await rebalancer.connect(deployer).configureVault(
        await vault.getAddress(),
        (await client.encryptInputs([Encryptable.uint16(500n)])).execute()[0],
        (await client.encryptInputs([Encryptable.uint32(86400n)])).execute()[0]
      );

      await vault.connect(deployer).initialize(
        await registry.getAddress(),
        await yieldRouter.getAddress(),
        await rebalancer.getAddress()
      );

      // 3. Deploy strategy
      const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
      const strategy = await MockStrategyFactory.connect(deployer).deploy(
        await asset.getAddress(),
        await vault.getAddress()
      );

      const encWeight = await client.encryptInputs([Encryptable.uint16(10000n)]).execute();
      await registry.connect(deployer).addStrategy(await strategy.getAddress(), encWeight[0]);
      await vault.connect(deployer).addStrategy(await strategy.getAddress());

      // 4. Multiple user deposits
      const deposit1 = 10000n * 10n ** 6n;
      const deposit2 = 15000n * 10n ** 6n;

      await asset.connect(user1).approve(await vault.getAddress(), deposit1);
      await vault.connect(user1).deposit(deposit1, user1.address);

      await asset.connect(user2).approve(await vault.getAddress(), deposit2);
      await vault.connect(user2).deposit(deposit2, user2.address);

      expect(await vault.totalAssets()).to.equal(deposit1 + deposit2);

      // 5. Deploy to strategy
      const deployAmount = (deposit1 + deposit2) / 2n;
      await vault.connect(keeper).deployToStrategy(await strategy.getAddress(), deployAmount);

      // 6. Report profit
      await strategy.setMockTotalAssets(deployAmount + 1000n * 10n ** 6n);
      await vault.connect(keeper).report(await strategy.getAddress());

      const yieldRouterShares = await vault.balanceOf(await yieldRouter.getAddress());
      expect(yieldRouterShares).to.be.gt(0n);

      // 7. User1 withdraws partial
      const withdrawAmount = deposit1 / 2n;
      await vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(deposit1 - withdrawAmount);

      // 8. Emergency pause and unpause
      await vault.connect(emergencyAdmin).pauseDeposits();
      expect(await vault.depositsPaused()).to.be.true;

      await vault.connect(deployer).unpauseDeposits();
      expect(await vault.depositsPaused()).to.be.false;

      // 9. Final state verification
      expect(await vault.totalAssets()).to.be.gt(0n);
      expect(await vault.totalPrincipal()).to.be.lt(deposit1 + deposit2);
    });
  });
});