import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("PrivateRebalancer", function () {
  async function deployRebalancerFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [signer, other, vaultAddr] = await hre.ethers.getSigners();

    // Deploy rebalancer with factory = signer
    const RebalancerFactory = await hre.ethers.getContractFactory(
      "PrivateRebalancer"
    );
    const rebalancer = await RebalancerFactory.connect(signer).deploy(
      signer.address // factory
    );

    const client = await hre.cofhe.createClientWithBatteries(signer);

    return { rebalancer, signer, other, vaultAddr, client };
  }

  describe("configureVault", function () {
    it("should configure vault and set isConfigured = true", async function () {
      const { rebalancer, signer, vaultAddr, client } =
        await loadFixture(deployRebalancerFixture);

      const encDrift = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      const encMinTime = await client
        .encryptInputs([Encryptable.uint32(86400n)])
        .execute();

      await rebalancer
        .connect(signer)
        .configureVault(vaultAddr.address, encDrift[0], encMinTime[0]);

      expect(await rebalancer.isConfigured(vaultAddr.address)).to.be.true;
    });

    it("should revert when called by non-factory", async function () {
      const { rebalancer, other, vaultAddr, client } =
        await loadFixture(deployRebalancerFixture);

      const encDrift = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      const encMinTime = await client
        .encryptInputs([Encryptable.uint32(86400n)])
        .execute();

      await expect(
        rebalancer
          .connect(other)
          .configureVault(vaultAddr.address, encDrift[0], encMinTime[0])
      ).to.be.revertedWith("PR: not factory");
    });

    it("should revert when configuring same vault twice", async function () {
      const { rebalancer, signer, vaultAddr, client } =
        await loadFixture(deployRebalancerFixture);

      const encDrift = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      const encMinTime = await client
        .encryptInputs([Encryptable.uint32(86400n)])
        .execute();

      await rebalancer
        .connect(signer)
        .configureVault(vaultAddr.address, encDrift[0], encMinTime[0]);

      const encDrift2 = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      const encMinTime2 = await client
        .encryptInputs([Encryptable.uint32(86400n)])
        .execute();

      await expect(
        rebalancer
          .connect(signer)
          .configureVault(vaultAddr.address, encDrift2[0], encMinTime2[0])
      ).to.be.revertedWith("PR: already configured");
    });
  });

  describe("checkRebalanceNeeded", function () {
    it("should return ebool decrypting to false when drift is 0 and time not elapsed", async function () {
      const { rebalancer, signer, vaultAddr, client } =
        await loadFixture(deployRebalancerFixture);

      const encDrift = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      // Very large min time so time condition is false
      const encMinTime = await client
        .encryptInputs([Encryptable.uint32(9999999n)])
        .execute();

      await rebalancer
        .connect(signer)
        .configureVault(vaultAddr.address, encDrift[0], encMinTime[0]);

      // Send the real tx so FHE operations persist in mock storage
      // Then parse TaskCreated events to find the 'or' result handle
      const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
      const taskManagerIface = new hre.ethers.Interface([
        "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
      ]);

      const tx = await rebalancer
        .connect(signer)
        .checkRebalanceNeeded(vaultAddr.address, hre.ethers.ZeroAddress, 0);
      const receipt = await tx.wait();

      // Find the last TaskCreated event (which is the 'or' result = shouldRebalance)
      const taskEvents = receipt!.logs
        .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
        .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
        .filter(e => e !== null && e.name === "TaskCreated");

      const orEvent = taskEvents.find(e => e!.args[1] === "or");
      expect(orEvent).to.not.be.undefined;

      const shouldRebalanceHandle = orEvent!.args[0];
      const plaintext = await hre.cofhe.mocks.getPlaintext(shouldRebalanceHandle);
      expect(plaintext).to.equal(0n); // false
    });

    it("should return ebool decrypting to true when drift > threshold", async function () {
      const { rebalancer, signer, vaultAddr, client } =
        await loadFixture(deployRebalancerFixture);

      const encDrift = await client
        .encryptInputs([Encryptable.uint16(500n)])
        .execute();
      // Very large min time so time condition is false
      const encMinTime = await client
        .encryptInputs([Encryptable.uint32(9999999n)])
        .execute();

      await rebalancer
        .connect(signer)
        .configureVault(vaultAddr.address, encDrift[0], encMinTime[0]);

      // Send the real tx so FHE operations persist in mock storage
      // Then parse TaskCreated events to find the 'or' result handle
      const TASK_MANAGER_ADDRESS = "0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9";
      const taskManagerIface = new hre.ethers.Interface([
        "event TaskCreated(uint256 ctHash, string operation, uint256 input1, uint256 input2, uint256 input3)"
      ]);

      const tx = await rebalancer
        .connect(signer)
        .checkRebalanceNeeded(vaultAddr.address, hre.ethers.ZeroAddress, 600);
      const receipt = await tx.wait();

      // Find the 'or' TaskCreated event (which is the shouldRebalance result)
      const taskEvents = receipt!.logs
        .filter(log => log.address.toLowerCase() === TASK_MANAGER_ADDRESS.toLowerCase())
        .map(log => { try { return taskManagerIface.parseLog(log); } catch { return null; } })
        .filter(e => e !== null && e.name === "TaskCreated");

      const orEvent = taskEvents.find(e => e!.args[1] === "or");
      expect(orEvent).to.not.be.undefined;

      const shouldRebalanceHandle = orEvent!.args[0];
      const plaintext = await hre.cofhe.mocks.getPlaintext(shouldRebalanceHandle);
      expect(plaintext).to.equal(1n); // true
    });
  });
});
