import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";

describe("FixedAllocationMechanism", function () {
  async function deployFixedAllocationFixture() {
    const [signer, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const MechanismFactory = await hre.ethers.getContractFactory(
      "FixedAllocationMechanism"
    );
    const mechanism = await MechanismFactory.connect(signer).deploy(
      signer.address,
      [addr1.address, addr2.address],
      [6000n, 4000n]
    );

    return { mechanism, signer, addr1, addr2, addr3 };
  }

  describe("getRecipients", function () {
    it("should return correct recipient addresses and weights", async function () {
      const { mechanism, addr1, addr2 } = await loadFixture(
        deployFixedAllocationFixture
      );

      const [recipients, weights] = await mechanism.getRecipients();
      expect(recipients[0]).to.equal(addr1.address);
      expect(recipients[1]).to.equal(addr2.address);
      expect(weights[0]).to.equal(6000n);
      expect(weights[1]).to.equal(4000n);
    });
  });

  describe("totalWeight", function () {
    it("should return 10000", async function () {
      const { mechanism } = await loadFixture(deployFixedAllocationFixture);
      expect(await mechanism.totalWeight()).to.equal(10000n);
    });
  });

  describe("updateRecipients", function () {
    it("should allow owner to update recipients and weights", async function () {
      const { mechanism, signer, addr1, addr2, addr3 } = await loadFixture(
        deployFixedAllocationFixture
      );

      await mechanism
        .connect(signer)
        .updateRecipients([addr1.address, addr3.address], [3000n, 7000n]);

      const [recipients, weights] = await mechanism.getRecipients();
      expect(recipients[0]).to.equal(addr1.address);
      expect(recipients[1]).to.equal(addr3.address);
      expect(weights[0]).to.equal(3000n);
      expect(weights[1]).to.equal(7000n);
      expect(await mechanism.totalWeight()).to.equal(10000n);
    });

    it("should revert when non-owner calls updateRecipients", async function () {
      const { mechanism, addr1, addr2, addr3 } = await loadFixture(
        deployFixedAllocationFixture
      );

      await expect(
        mechanism
          .connect(addr3)
          .updateRecipients([addr1.address, addr2.address], [5000n, 5000n])
      ).to.be.revertedWith("FAM: not owner");
    });

    it("should revert when updating with empty recipients", async function () {
      const { mechanism, signer } = await loadFixture(
        deployFixedAllocationFixture
      );

      await expect(
        mechanism.connect(signer).updateRecipients([], [])
      ).to.be.revertedWith("FAM: no recipients");
    });
  });

  describe("constructor validation", function () {
    it("should revert when deployed with empty recipients", async function () {
      const [signer] = await hre.ethers.getSigners();
      const MechanismFactory = await hre.ethers.getContractFactory(
        "FixedAllocationMechanism"
      );
      await expect(
        MechanismFactory.connect(signer).deploy(signer.address, [], [])
      ).to.be.revertedWith("FAM: no recipients");
    });
  });
});
