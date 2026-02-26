import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { PermitUtils } from "@cofhe/sdk/permits";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("Counter", function () {
  async function deployCounterFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [signer, bob, alice] = await hre.ethers.getSigners();

    const Counter = await hre.ethers.getContractFactory("Counter");
    const counter = await Counter.connect(bob).deploy();

    const client = await hre.cofhesdk.createBatteriesIncludedCofhesdkClient(
      bob,
    );

    return { counter, signer, bob, alice, client };
  }

  describe("Functionality", function () {
    it("Should increment the counter", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      const count = await counter.count();
      const decrypted = await client
        .decryptHandle(count, FheTypes.Uint32)
        .decrypt();
      expect(decrypted).to.equal(0n);

      await counter.connect(bob).increment();

      const count2 = await counter.count();
      const decrypted2 = await client
        .decryptHandle(count2, FheTypes.Uint32)
        .decrypt();
      expect(decrypted2).to.equal(1n);
    });

    it("Should decrement the counter", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      // First increment to 1 so we can decrement back to 0
      await counter.connect(bob).increment();

      const count = await counter.count();
      const decrypted = await client
        .decryptHandle(count, FheTypes.Uint32)
        .decrypt();
      expect(decrypted).to.equal(1n);

      await counter.connect(bob).decrement();

      const count2 = await counter.count();
      const decrypted2 = await client
        .decryptHandle(count2, FheTypes.Uint32)
        .decrypt();
      expect(decrypted2).to.equal(0n);
    });

    it("Should encrypt input and reset counter", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      const encrypted = await client
        .encryptInputs([Encryptable.uint32(2000n)])
        .encrypt();
      await counter.connect(bob).reset(encrypted[0]);

      const count = await counter.count();
      const decrypted = await client
        .decryptHandle(count, FheTypes.Uint32)
        .decrypt();
      expect(decrypted).to.equal(2000n);
    });

    it("Should handle multiple operations in sequence", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      // Reset to 10
      const encrypted = await client
        .encryptInputs([Encryptable.uint32(10n)])
        .encrypt();
      await counter.connect(bob).reset(encrypted[0]);

      // Increment 3 times: 10 -> 11 -> 12 -> 13
      await counter.connect(bob).increment();
      await counter.connect(bob).increment();
      await counter.connect(bob).increment();

      // Decrement once: 13 -> 12
      await counter.connect(bob).decrement();

      const count = await counter.count();
      const decrypted = await client
        .decryptHandle(count, FheTypes.Uint32)
        .decrypt();
      expect(decrypted).to.equal(12n);
    });
  });

  describe("On-chain Decryption", function () {
    it("Should revert getDecryptedValue before decryption is returned", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      // Set counter to a known value
      const encrypted = await client
        .encryptInputs([Encryptable.uint32(42n)])
        .encrypt();
      await counter.connect(bob).reset(encrypted[0]);

      // Request on-chain decryption (async — the coprocessor calls back later)
      await counter.connect(bob).decryptCounter();

      // In mock mode, the coprocessor decryption hasn't been processed yet
      // so getDecryptedValue should revert with "Value is not ready"
      await expect(counter.getDecryptedValue()).to.be.revertedWith(
        "Value is not ready",
      );
    });

    it("Should return decrypted value after enough time has passed", async function () {
      const { counter, bob, client } = await loadFixture(deployCounterFixture);

      // Set counter to a known value
      const encrypted = await client
        .encryptInputs([Encryptable.uint32(42n)])
        .encrypt();
      await counter.connect(bob).reset(encrypted[0]);

      // Request on-chain decryption
      await counter.connect(bob).decryptCounter();

      // Advance time to allow the mock coprocessor to process the decryption callback
      await time.increase(100);

      // Now the decrypted value should be available
      const decryptedValue = await counter.getDecryptedValue();
      expect(decryptedValue).to.equal(42n);
    });
  });

  describe("Mock Logging", function () {
    it("Should execute operations with mock logging via withLogs", async function () {
      const { counter, bob } = await loadFixture(deployCounterFixture);

      // withLogs wraps a block of code and logs all FHE operations within it
      await hre.cofhesdk.mocks.withLogs(
        "counter.increment()",
        async () => {
          await counter.connect(bob).increment();
        },
      );

      // Verify the operation still executed correctly
      const plaintext = await hre.cofhesdk.mocks.getPlaintext(
        await counter.count(),
      );
      expect(plaintext).to.equal(1n);
    });

    it("Should check plaintext values directly via mocks.expectPlaintext", async function () {
      const { counter, bob } = await loadFixture(deployCounterFixture);

      await counter.connect(bob).increment();
      await counter.connect(bob).increment();

      // mocks.expectPlaintext asserts on the plaintext behind a ciphertext hash
      const countHash = await counter.count();
      await hre.cofhesdk.mocks.expectPlaintext(countHash, 2n);
    });
  });

  describe("Permits", function () {
    it("Self permit should be valid on chain", async function () {
      const { bob, client } = await loadFixture(deployCounterFixture);

      const permit = await client.permits.createSelf({
        issuer: bob.address,
        name: "Test Permit",
      });

      const isValid = await PermitUtils.checkValidityOnChain(
        permit,
        client.getSnapshot().publicClient!,
      );

      expect(isValid).to.be.true;
    });

    it("Expired permit should revert with PermissionInvalid_Expired", async function () {
      const { bob, client } = await loadFixture(deployCounterFixture);

      const permit = await client.permits.createSelf({
        issuer: bob.address,
        name: "Expired Permit",
        expiration: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      try {
        await PermitUtils.checkValidityOnChain(
          permit,
          client.getSnapshot().publicClient!,
        );
        expect.fail(
          "Expected PermitUtils.checkValidityOnChain to throw for expired permit",
        );
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal(
          "PermissionInvalid_Expired",
        );
      }
    });

    it("Invalid issuer signature should revert with PermissionInvalid_IssuerSignature", async function () {
      const { bob, client } = await loadFixture(deployCounterFixture);

      const permit = await client.permits.createSelf({
        issuer: bob.address,
        name: "Tampered Permit",
      });

      // Tamper with the issuer signature
      permit.issuerSignature =
        "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

      try {
        await PermitUtils.checkValidityOnChain(
          permit,
          client.getSnapshot().publicClient!,
        );
        expect.fail(
          "Expected PermitUtils.checkValidityOnChain to throw for invalid signature",
        );
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal(
          "PermissionInvalid_IssuerSignature",
        );
      }
    });
  });
});
