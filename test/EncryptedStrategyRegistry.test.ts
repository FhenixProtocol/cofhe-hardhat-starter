import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("EncryptedStrategyRegistry", function () {
  async function deployRegistryFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [signer, other] = await hre.ethers.getSigners();

    // Deploy registry with vault=owner=signer, maxStrategies=5, factory=signer
    const RegistryFactory = await hre.ethers.getContractFactory(
      "EncryptedStrategyRegistry"
    );
    const registry = await RegistryFactory.connect(signer).deploy(
      signer.address, // vault
      signer.address, // owner
      5,             // maxStrategies
      signer.address // factory
    );

    const client = await hre.cofhe.createClientWithBatteries(signer);

    // Use some EOA addresses as mock strategies
    const [, , addr1, addr2, addr3, addr4, addr5, addr6] =
      await hre.ethers.getSigners();

    return { registry, signer, other, client, addr1, addr2, addr3, addr4, addr5, addr6 };
  }

  describe("addStrategy", function () {
    it("should add first strategy and strategyCount == 1", async function () {
      const { registry, signer, client, addr1 } =
        await loadFixture(deployRegistryFixture);

      const encrypted = await client
        .encryptInputs([Encryptable.uint16(5000n)])
        .execute();

      await registry.connect(signer).addStrategy(addr1.address, encrypted[0]);

      expect(await registry.strategyCount()).to.equal(1n);
    });

    it("should add second strategy and strategyCount == 2", async function () {
      const { registry, signer, client, addr1, addr2 } =
        await loadFixture(deployRegistryFixture);

      const enc1 = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(signer).addStrategy(addr1.address, enc1[0]);

      const enc2 = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(signer).addStrategy(addr2.address, enc2[0]);

      expect(await registry.strategyCount()).to.equal(2n);
    });

    it("should revert when adding beyond maxStrategies", async function () {
      const { registry, signer, client, addr1, addr2, addr3, addr4, addr5, addr6 } =
        await loadFixture(deployRegistryFixture);

      const signers = [addr1, addr2, addr3, addr4, addr5];
      for (const s of signers) {
        const enc = await client.encryptInputs([Encryptable.uint16(1000n)]).execute();
        await registry.connect(signer).addStrategy(s.address, enc[0]);
      }

      expect(await registry.strategyCount()).to.equal(5n);

      const enc = await client.encryptInputs([Encryptable.uint16(1000n)]).execute();
      await expect(
        registry.connect(signer).addStrategy(addr6.address, enc[0])
      ).to.be.revertedWith("ESR: max strategies reached");
    });

    it("should revert when non-owner calls addStrategy", async function () {
      const { registry, other, client, addr1 } =
        await loadFixture(deployRegistryFixture);

      const enc = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await expect(
        registry.connect(other).addStrategy(addr1.address, enc[0])
      ).to.be.revertedWith("ESR: not owner");
    });
  });

  describe("removeStrategy", function () {
    it("should mark strategy as inactive after removeStrategy", async function () {
      const { registry, signer, client, addr1 } =
        await loadFixture(deployRegistryFixture);

      const enc = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(signer).addStrategy(addr1.address, enc[0]);

      // getActive is authorized — signer is both vault and owner, so allowed
      // Use staticCall to get the return value without sending a transaction
      const activeBefore = await registry.connect(signer).getActive.staticCall(addr1.address);
      const activePlainBefore = await hre.cofhe.mocks.getPlaintext(activeBefore);
      expect(activePlainBefore).to.equal(1n); // true

      await registry.connect(signer).removeStrategy(addr1.address);

      const activeAfter = await registry.connect(signer).getActive.staticCall(addr1.address);
      const activePlainAfter = await hre.cofhe.mocks.getPlaintext(activeAfter);
      expect(activePlainAfter).to.equal(0n); // false
    });
  });

  describe("updateWeight", function () {
    it("should update weight and reflect in weight sum", async function () {
      const { registry, signer, client, addr1 } =
        await loadFixture(deployRegistryFixture);

      const enc = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(signer).addStrategy(addr1.address, enc[0]);

      // Check initial weight sum using staticCall to get the return value
      const sumBefore = await registry.connect(signer).getWeightSum.staticCall();
      await hre.cofhe.mocks.expectPlaintext(sumBefore, 5000n);

      // Update weight to 8000
      const encNew = await client.encryptInputs([Encryptable.uint16(8000n)]).execute();
      await registry.connect(signer).updateWeight(addr1.address, encNew[0]);

      const sumAfter = await registry.connect(signer).getWeightSum.staticCall();
      await hre.cofhe.mocks.expectPlaintext(sumAfter, 8000n);
    });
  });

  describe("getWeightSum", function () {
    it("should return encrypted sum that decrypts to sum of weights", async function () {
      const { registry, signer, client, addr1, addr2 } =
        await loadFixture(deployRegistryFixture);

      const enc1 = await client.encryptInputs([Encryptable.uint16(6000n)]).execute();
      await registry.connect(signer).addStrategy(addr1.address, enc1[0]);

      const enc2 = await client.encryptInputs([Encryptable.uint16(4000n)]).execute();
      await registry.connect(signer).addStrategy(addr2.address, enc2[0]);

      // staticCall gets the handle, then real tx persists the FHE.allowSender state
      const weightSum = await registry.connect(signer).getWeightSum.staticCall();
      await registry.connect(signer).getWeightSum();

      // Use getPlaintext to read the encrypted value from mock storage
      const decrypted = await hre.cofhe.mocks.getPlaintext(weightSum);

      expect(decrypted).to.equal(10000n);
    });
  });

  describe("isStrategyRegistered", function () {
    it("should return true after adding, false for unknown", async function () {
      const { registry, signer, client, addr1, addr2 } =
        await loadFixture(deployRegistryFixture);

      const enc = await client.encryptInputs([Encryptable.uint16(5000n)]).execute();
      await registry.connect(signer).addStrategy(addr1.address, enc[0]);

      expect(await registry.isStrategyRegistered(addr1.address)).to.be.true;
      expect(await registry.isStrategyRegistered(addr2.address)).to.be.false;
    });
  });
});
