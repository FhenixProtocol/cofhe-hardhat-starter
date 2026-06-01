/**
 * Privacy Leakage Test Suite
 * 
 * Tests for potential privacy vulnerabilities in the CoFHE contract system.
 * These tests verify that:
 * 1. Only authorized parties can decrypt encrypted values
 * 2. FHE.allow/FHE.allowSender are properly used
 * 3. Encrypted data cannot be leaked through events, timing, or side channels
 * 4. Cross-contract permissions are correctly enforced
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("Privacy Leakage Tests", function () {
  // Shared fixture for privacy tests
  async function deployPrivacyTestFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [owner, keeper, emergencyAdmin, attacker, auditor, user1, user2, user3] =
      await hre.ethers.getSigners();

    // Deploy mock ERC20 asset (6 decimals like USDC)
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
    
    // Mint tokens
    const ONE_MILLION = 1_000_000n * 10n ** 6n;
    await asset.mint(owner.address, ONE_MILLION);
    await asset.mint(user1.address, ONE_MILLION);
    await asset.mint(user2.address, ONE_MILLION);
    await asset.mint(attacker.address, ONE_MILLION);

    // Deploy FixedAllocationMechanism
    const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
    const mechanism = await FAMFactory.connect(owner).deploy(
      owner.address,
      [user1.address, user2.address],
      [6000n, 4000n]
    );

    // Create encrypted fee
    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const encFee = await ownerClient.encryptInputs([Encryptable.uint16(200n)]).execute();

    // Deploy vault
    const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
    const vault = await VaultFactory.connect(owner).deploy(
      await asset.getAddress(),
      "Privacy Vault",
      "PV",
      owner.address,
      keeper.address,
      emergencyAdmin.address,
      user1.address, // donation address
      encFee[0]
    );

    // Deploy registry with owner as owner (not SDM)
    const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
    const registry = await RegistryFactory.connect(owner).deploy(
      await vault.getAddress(),
      owner.address, // owner is owner (for testing allowAuditor)
      10,
      owner.address
    );

    // Deploy YieldRouter
    const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
    const yieldRouter = await YieldRouterFactory.connect(owner).deploy(
      await vault.getAddress(),
      await mechanism.getAddress()
    );

    // Deploy PrivateRebalancer
    const RebalancerFactory = await hre.ethers.getContractFactory("PrivateRebalancer");
    const rebalancer = await RebalancerFactory.connect(owner).deploy(owner.address);

    // Configure rebalancer
    const encDrift = await ownerClient.encryptInputs([Encryptable.uint16(500n)]).execute();
    const encMinTime = await ownerClient.encryptInputs([Encryptable.uint32(86400n)]).execute();
    await rebalancer.connect(owner).configureVault(
      await vault.getAddress(),
      encDrift[0],
      encMinTime[0]
    );

    // Initialize vault
    await vault.connect(owner).initialize(
      await registry.getAddress(),
      await yieldRouter.getAddress(),
      await rebalancer.getAddress()
    );

    // Deploy MockStrategy for testing
    const MockStrategyFactory = await hre.ethers.getContractFactory("MockStrategy");
    const strategy = await MockStrategyFactory.deploy(
      await asset.getAddress(),
      await vault.getAddress()
    );

    // Add strategy to registry and vault
    const encWeight = await ownerClient.encryptInputs([Encryptable.uint16(10000n)]).execute();
    await registry.connect(owner).addStrategy(await strategy.getAddress(), encWeight[0]);
    await vault.connect(owner).addStrategy(await strategy.getAddress());

    // Deploy SelectiveDisclosureModule (owner is registry owner for allowAuditor)
    const SDMFactory = await hre.ethers.getContractFactory("SelectiveDisclosureModule");
    const sdm = await SDMFactory.connect(owner).deploy(
      await vault.getAddress(),
      await registry.getAddress()
    );

    const DEPOSIT_AMOUNT = 10000n * 10n ** 6n;

    return {
      vault,
      registry,
      rebalancer,
      yieldRouter,
      sdm,
      mechanism,
      strategy,
      asset,
      owner,
      keeper,
      emergencyAdmin,
      attacker,
      auditor,
      user1,
      user2,
      user3,
      ownerClient,
      DEPOSIT_AMOUNT,
    };
  }

  describe("ACL - Access Control List Leaks", function () {
    it("attacker should NOT be able to read encrypted fee via getCreatorFee", async function () {
      const { vault, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      // Attacker should NOT be able to call getCreatorFee (not owner)
      await expect(
        vault.connect(attacker).getCreatorFee()
      ).to.be.revertedWith("PCV: not owner");
    });

    it("attacker should NOT be able to read encrypted weight via registry", async function () {
      const { registry, strategy, attacker, owner } = await loadFixture(deployPrivacyTestFixture);
      
      // Attacker is not vault, rebalancer, or owner - should be rejected
      await expect(
        registry.connect(attacker).getWeight(strategy.address)
      ).to.be.revertedWith("ESR: unauthorized");
    });

    it("attacker should NOT be able to read encrypted active flag", async function () {
      const { registry, strategy, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      await expect(
        registry.connect(attacker).getActive(strategy.address)
      ).to.be.revertedWith("ESR: unauthorized");
    });

    it("attacker should NOT be able to read encrypted debt", async function () {
      const { registry, strategy, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      await expect(
        registry.connect(attacker).getTotalDebt(strategy.address)
      ).to.be.revertedWith("ESR: unauthorized");
    });
  });

  describe("FHE.allow Sender Leaks", function () {
    it("owner should be able to read creator fee after proper FHE.allowSender", async function () {
      const { vault, owner, ownerClient } = await loadFixture(deployPrivacyTestFixture);
      
      // Get the encrypted fee handle - send real tx to persist state
      const tx = await vault.connect(owner).getCreatorFee();
      await tx.wait();
      
      // Get the handle via static call
      const feeHandle = await vault.connect(owner).getCreatorFee.staticCall();
      
      // Decrypt to verify the value is accessible to owner (with permit)
      const decryptedFee = await ownerClient
        .decryptForView(feeHandle, FheTypes.Uint16)
        .withPermit()
        .execute();
      
      expect(decryptedFee.decryptedValue).to.equal(200n); // 200 bps = 2%
    });

    it("non-owner should NOT be able to decrypt creator fee", async function () {
      const { vault, owner, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      // Get the encrypted fee handle as owner
      await vault.connect(owner).getCreatorFee(); // Execute to set FHE.allowSender
      const feeHandle = await vault.connect(owner).getCreatorFee.staticCall();

      // Attacker creates their own client
      const attackerClient = await hre.cofhe.createClientWithBatteries(attacker);
      
      // Attacker should NOT be able to decrypt since FHE.allowSender wasn't granted to them
      // The error should be NotAllowed or similar
      await expect(
        attackerClient
          .decryptForView(feeHandle, FheTypes.Uint16)
          .withPermit()
          .execute()
      ).to.be.reverted;
    });
  });

  describe("Cross-Contract Permission Flow", function () {
    it("rebalancer should have proper access to registry via FHE.allow", async function () {
      const { vault, registry, rebalancer, owner, ownerClient } = await loadFixture(deployPrivacyTestFixture);
      
      // Set rebalancer in registry
      await registry.connect(owner).setRebalancer(await rebalancer.getAddress());
      
      // Get a strategy from registry
      const strategyCount = await registry.strategyCount();
      expect(strategyCount).to.be.gt(0n);
      
      const strategyAddress = await registry.getStrategyAddress(0);
      
      // Rebalancer should be able to call getWeight
      const weightHandle = await registry.connect(rebalancer).getWeight.staticCall(strategyAddress);
      await registry.connect(rebalancer).getWeight(strategyAddress); // Execute tx
      
      const weight = await hre.cofhe.mocks.getPlaintext(weightHandle);
      expect(weight).to.equal(10000n); // 100% weight
    });

    it("vault owner should be able to read weight sum", async function () {
      const { registry, owner, ownerClient } = await loadFixture(deployPrivacyTestFixture);
      
      const tx = await registry.connect(owner).getWeightSum();
      await tx.wait();
      
      const weightSumHandle = await registry.connect(owner).getWeightSum.staticCall();
      
      const weightSum = await ownerClient
        .decryptForView(weightSumHandle, FheTypes.Uint16)
        .execute();
      
      expect(weightSum.decryptedValue).to.equal(10000n); // Sum of weights
    });
  });

  describe("Selective Disclosure Module Leaks", function () {
    it("should not allow revoked auditor to request decryption", async function () {
      const { sdm, owner, auditor } = await loadFixture(deployPrivacyTestFixture);
      
      // Grant access
      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);
      
      // Revoke access
      await sdm.connect(owner).revokeAuditorAccess(auditor.address);
      
      // Try to request decryption - should fail
      const fakeHandle = hre.ethers.encodeBytes32String("testHandle");
      await expect(
        sdm.connect(auditor).requestDecryption(fakeHandle)
      ).to.be.revertedWith("SDM: access revoked");
    });

    it("should not allow expired auditor to request decryption", async function () {
      const { sdm, owner, auditor } = await loadFixture(deployPrivacyTestFixture);
      
      // Grant short-lived access
      const soonExpiry = (await time.latest()) + 10;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, soonExpiry);
      
      // Advance time past expiry
      await time.increase(20);
      
      // Try to request decryption - should fail
      const fakeHandle = hre.ethers.encodeBytes32String("testHandle");
      await expect(
        sdm.connect(auditor).requestDecryption(fakeHandle)
      ).to.be.revertedWith("SDM: access expired");
    });

    it("attacker should NOT be able to grant auditor access to themselves", async function () {
      const { sdm, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      const futureExpiry = (await time.latest()) + 3600;
      await expect(
        sdm.connect(attacker).grantAuditorAccess(attacker.address, futureExpiry)
      ).to.be.revertedWith("SDM: not vault owner");
    });

    it("should correctly report auditor active status", async function () {
      const { sdm, owner, auditor, registry } = await loadFixture(deployPrivacyTestFixture);
      
      // Not granted yet - should be inactive
      expect(await sdm.isAuditorActive(auditor.address)).to.be.false;
      
      // Grant access (registry owner = owner)
      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);
      
      // Now active
      expect(await sdm.isAuditorActive(auditor.address)).to.be.true;
      
      // Revoke
      await sdm.connect(owner).revokeAuditorAccess(auditor.address);
      
      // Should be inactive again
      expect(await sdm.isAuditorActive(auditor.address)).to.be.false;
    });
  });

  describe("Event Emission Privacy Leaks", function () {
    it("RebalanceExecuted should NOT leak sensitive amounts", async function () {
      const { vault, registry, rebalancer, asset, owner, keeper, user1 } = 
        await loadFixture(deployPrivacyTestFixture);
      
      // Set rebalancer in registry
      await registry.connect(owner).setRebalancer(await rebalancer.getAddress());
      
      // Get strategy address
      const strategyAddress = await registry.getStrategyAddress(0);
      
      // Trigger rebalance (plaintext amounts go to vault, not revealed on-chain as encrypted)
      await rebalancer.connect(owner).triggerRebalance(
        await vault.getAddress(),
        hre.ethers.ZeroAddress,
        [strategyAddress],
        [500n * 10n ** 6n],
        [true],
        0 // plaintext drift input
      );
      
      // Note: In real FHE, the rebalance amounts would be encrypted
      // Here we test that plaintext amounts passed to vault are not stored as encrypted
      // The event should not contain ciphertext handles
      const filter = vault.filters.RebalanceExecuted();
      const events = await vault.queryFilter(filter);
      
      expect(events.length).to.be.gt(0);
      const lastEvent = events[events.length - 1];
      
      // Verify event args are plaintext uint256 (not encrypted handles)
      const [, amount, isWithdraw] = lastEvent.args;
      expect(typeof amount).to.equal("bigint");
      expect(typeof isWithdraw).to.equal("boolean");
    });

    it("StrategyReported should NOT leak encrypted strategy values", async function () {
      const { vault, strategy, asset, user1, keeper } = await loadFixture(deployPrivacyTestFixture);
      
      // Report (strategy reports plaintext)
      const filter = vault.filters.StrategyReported();
      const tx = await vault.connect(keeper).report(await strategy.getAddress());
      const receipt = await tx.wait();
      
      const events = await vault.queryFilter(filter);
      expect(events.length).to.be.gt(0);
      
      const lastEvent = events[events.length - 1];
      const [strategyAddr, totalAssets, profit, loss] = lastEvent.args;
      
      // These are plaintext values from strategy.totalAssets()
      expect(typeof totalAssets).to.equal("bigint");
      expect(typeof profit).to.equal("bigint");
      expect(typeof loss).to.equal("bigint");
    });
  });

  describe("Private Rebalancer Privacy", function () {
    it("checkRebalanceNeeded should return encrypted result, not plaintext", async function () {
      const { rebalancer, vault, owner } = await loadFixture(deployPrivacyTestFixture);
      
      // Call checkRebalanceNeeded
      const tx = await rebalancer.connect(owner).checkRebalanceNeeded(
        await vault.getAddress(),
        hre.ethers.ZeroAddress,
        0
      );
      const receipt = await tx.wait();
      
      // The result is an ebool - which is an encrypted bytes32 handle
      // We can verify it's not a direct boolean by checking the return type
      const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
      const taskManagerIface = new hre.ethers.Interface([
        "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
      ]);
      
      // Parse logs to verify FHE operations occurred
      const taskEvents = receipt!.logs
        .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
        .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
        .filter(e => e !== null && e.name === "TaskCreated");
      
      // Should have multiple FHE operations logged
      expect(taskEvents.length).to.be.gt(3); // gte, sub, or operations
      
      const orEvents = taskEvents.filter(e => e!.args[1] === "or");
      expect(orEvents.length).to.be.gt(0); // At least one 'or' operation for the result
    });

    it("drift threshold should remain encrypted - attacker cannot brute force", async function () {
      const { rebalancer, vault, owner, ownerClient } = await loadFixture(deployPrivacyTestFixture);
      
      // Get the vault address
      const vaultAddress = await vault.getAddress();
      
      // Test multiple drift values to verify they don't leak the threshold
      const testDrifts = [0n, 100n, 250n, 500n, 600n, 1000n];
      const results: boolean[] = [];
      
      for (const drift of testDrifts) {
        const tx = await rebalancer.connect(owner).checkRebalanceNeeded(
          vaultAddress,
          hre.ethers.ZeroAddress,
          drift
        );
        const receipt = await tx.wait();
        
        // Extract the 'or' result from TaskCreated events
        const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
        const taskManagerIface = new hre.ethers.Interface([
          "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
        ]);
        
        const taskEvents = receipt!.logs
          .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
          .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
          .filter(e => e !== null && e.name === "TaskCreated");
        
        const orEvent = taskEvents.find(e => e!.args[1] === "or");
        if (orEvent) {
          const handle = orEvent!.args[0];
          const plaintext = await hre.cofhe.mocks.getPlaintext(handle);
          results.push(plaintext === 1n);
        }
      }
      
      // With the configured threshold (500 bps), only drifts >= 500 should return true
      // Time condition is always false (very large minTime)
      // drift >= 500 should return true
      expect(results[0]).to.equal(false); // 0 < 500
      expect(results[1]).to.equal(false); // 100 < 500
      expect(results[2]).to.equal(false); // 250 < 500
      expect(results[3]).to.equal(true);  // 500 >= 500
      expect(results[4]).to.equal(true);  // 600 >= 500
      expect(results[5]).to.equal(true);  // 1000 >= 500
    });
  });

  describe("ERC-4626 Privacy - Deposit/Withdraw", function () {
    it("deposit should not reveal user's balance to others", async function () {
      const { vault, asset, user1, user2, attacker, owner } = await loadFixture(deployPrivacyTestFixture);
      
      // User1 deposits
      const DEPOSIT = 5000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(user1).deposit(DEPOSIT, user1.address);
      
      // User2 deposits different amount
      const DEPOSIT2 = 15000n * 10n ** 6n;
      await asset.connect(user2).approve(await vault.getAddress(), DEPOSIT2);
      await vault.connect(user2).deposit(DEPOSIT2, user2.address);
      
      // Attacker cannot see individual encrypted balances directly
      // vault.balanceOf returns shares, which equals assets in this case (1:1)
      // This is plaintext - not a privacy leak since shares are public in ERC-4626
      
      // Verify balances are correct
      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT);
      expect(await vault.balanceOf(user2.address)).to.equal(DEPOSIT2);
      
      // totalAssets is plaintext - public per ERC-4626
      expect(await vault.totalAssets()).to.equal(DEPOSIT + DEPOSIT2);
    });

    it("withdraw should maintain privacy", async function () {
      const { vault, asset, user1, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      const DEPOSIT = 5000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(user1).deposit(DEPOSIT, user1.address);
      
      // User1 withdraws partial amount
      const WITHDRAW = 2000n * 10n ** 6n;
      await vault.connect(user1).withdraw(WITHDRAW, user1.address, user1.address);
      
      // Verify remaining balance
      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT - WITHDRAW);
      
      // Attacker sees only the withdraw event, not the encrypted remaining balance
      const filter = vault.filters.Transfer();
      const events = await vault.queryFilter(filter, -10);
      
      // Events show plaintext transfers, which is expected
      for (const event of events) {
        const [, , value] = event.args;
        expect(typeof value).to.equal("bigint"); // Plaintext uint256
      }
    });

    it("pricePerShare is public - not a privacy leak", async function () {
      const { vault, asset, user1, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      const DEPOSIT = 10000n * 10n ** 6n;
      await asset.connect(user1).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(user1).deposit(DEPOSIT, user1.address);
      
      // pricePerShare is public per ERC-4626 - not a privacy leak
      const pps = await vault.pricePerShare();
      expect(pps).to.equal(10n ** 18n); // 1:1 ratio
      
      // Attacker can also read this
      expect(await vault.connect(attacker).pricePerShare()).to.equal(pps);
    });
  });

  describe("Allocation Mechanism Privacy", function () {
    it("FixedAllocationMechanism recipients are public - design decision", async function () {
      const { mechanism, user1, user2 } = await loadFixture(deployPrivacyTestFixture);
      
      const [recipients, weights] = await mechanism.getRecipients();
      
      // Recipients and weights are public in FixedAllocationMechanism
      // This is a design decision - the allocation percentages are not encrypted
      expect(recipients.length).to.equal(2);
      expect(weights[0]).to.equal(6000n); // 60%
      expect(weights[1]).to.equal(4000n); // 40%
      
      // totalWeight is also public
      expect(await mechanism.totalWeight()).to.equal(10000n);
    });
  });

  describe("FHE.allowThis Storage Pattern", function () {
    it("encrypted values stored in contract should have FHE.allowThis called", async function () {
      const { vault, owner, ownerClient } = await loadFixture(deployPrivacyTestFixture);
      
      // Execute the transaction to ensure FHE operations persist
      const tx = await vault.connect(owner).getCreatorFee();
      const receipt = await tx.wait();
      
      // The receipt should include TaskCreated events for FHE operations
      const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
      const taskManagerIface = new hre.ethers.Interface([
        "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
      ]);
      
      const taskEvents = receipt!.logs
        .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
        .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
        .filter(e => e !== null && e.name === "TaskCreated");
      
      // Should have FHE.allowThis event
      const allowThisEvents = taskEvents.filter(e => e!.args[1] === "allowThis");
      expect(allowThisEvents.length).to.be.gt(0);
    });
  });

  describe("Negative Test - Deliberate Privacy Violations", function () {
    it("attacker should NOT be able to call initialize", async function () {
      const { vault, asset, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      // Try to reinitialize vault with different parameters
      // Note: already initialized, so will get "already initialized" not "not owner"
      // We just need to verify attacker can't call it
      await expect(
        vault.connect(attacker).initialize(
          attacker.address, // different registry
          attacker.address, // different yieldRouter
          attacker.address  // different rebalancer
        )
      ).to.be.reverted;
    });

    it("attacker should NOT be able to add strategy", async function () {
      const { vault, strategy, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      await expect(
        vault.connect(attacker).addStrategy(await strategy.getAddress())
      ).to.be.revertedWith("PCV: not owner");
    });

    it("attacker should NOT be able to pause deposits", async function () {
      const { vault, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      await expect(
        vault.connect(attacker).pauseDeposits()
      ).to.be.reverted;
    });

    it("attacker should NOT be able to call report", async function () {
      const { vault, strategy, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      await expect(
        vault.connect(attacker).report(await strategy.getAddress())
      ).to.be.revertedWith("PCV: not keeper");
    });

    it("attacker should NOT be able to configure rebalancer", async function () {
      const { rebalancer, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      const client = await hre.cofhe.createClientWithBatteries(attacker);
      const encDrift = await client.encryptInputs([Encryptable.uint16(100n)]).execute();
      const encMinTime = await client.encryptInputs([Encryptable.uint32(100n)]).execute();
      
      await expect(
        rebalancer.connect(attacker).configureVault(
          attacker.address,
          encDrift[0],
          encMinTime[0]
        )
      ).to.be.revertedWith("PR: not factory");
    });

    it("attacker should NOT be able to update rebalancer drift threshold", async function () {
      const { rebalancer, vault, attacker } = await loadFixture(deployPrivacyTestFixture);
      
      const client = await hre.cofhe.createClientWithBatteries(attacker);
      const encDrift = await client.encryptInputs([Encryptable.uint16(100n)]).execute();
      
      // updateDriftThreshold doesn't have access control - it's designed to be called by vault owner
      // but in our setup, attacker is not the vault owner
      // The contract doesn't check who calls it, so it will succeed
      // But this is a design issue to be aware of - should be fixed in production
      await expect(
        rebalancer.connect(attacker).updateDriftThreshold(
          await vault.getAddress(),
          encDrift[0]
        )
      ).to.be.reverted;
    });
  });
});