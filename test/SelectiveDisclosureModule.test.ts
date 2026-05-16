import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("SelectiveDisclosureModule", function () {
  async function deploySDMFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [owner, keeper, emergencyAdmin, auditor, otherAuditor] =
      await hre.ethers.getSigners();

    // Deploy mock asset
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);

    // Deploy FixedAllocationMechanism
    const FAMFactory = await hre.ethers.getContractFactory("FixedAllocationMechanism");
    const mechanism = await FAMFactory.deploy(
      owner.address,
      [owner.address],
      [10000n]
    );

    // Encrypt fee (this may send transactions via FHE setup, check nonce after)
    const client = await hre.cofhe.createClientWithBatteries(owner);
    const encFee = await client.encryptInputs([Encryptable.uint16(200n)]).execute();

    // Deploy vault
    const VaultFactory = await hre.ethers.getContractFactory("PrivateComposableVault");
    const vault = await VaultFactory.connect(owner).deploy(
      await asset.getAddress(),
      "Test Vault",
      "TV",
      owner.address,    // owner — the SDM will check vault.owner() == msg.sender
      keeper.address,
      emergencyAdmin.address,
      owner.address,
      encFee[0]
    );

    // Get nonce RIGHT BEFORE deploying registry.
    // After this point owner will deploy: registry (nonce+0), SDM (nonce+1)
    // yieldRouter is deployed by the default signer (index 0 = owner), so we must
    // use a different signer for yieldRouter, or account for it.
    // Let's deploy yieldRouter FIRST (also by owner) so we can track nonce precisely.
    const YieldRouterFactory = await hre.ethers.getContractFactory("YieldRouter");
    const yieldRouter = await YieldRouterFactory.connect(owner).deploy(
      await vault.getAddress(),
      await mechanism.getAddress()
    );

    // NOW get nonce — next owner txs will be: registry(+0), initialize(+1), SDM(+2)
    const nonceBeforeRegistry = await hre.ethers.provider.getTransactionCount(owner.address);
    const sdmAddress = hre.ethers.getCreateAddress({
      from: owner.address,
      nonce: nonceBeforeRegistry + 2  // registry(+0), initialize(+1), SDM(+2)
    });

    // Deploy registry with SDM as owner so SDM can call allowAuditor
    const RegistryFactory = await hre.ethers.getContractFactory("EncryptedStrategyRegistry");
    const registry = await RegistryFactory.connect(owner).deploy(
      await vault.getAddress(),
      sdmAddress, // owner = future SDM address
      10,
      owner.address // factory = owner for testing
    );

    // Initialize vault (sends tx from owner, advancing nonce by 1)
    await vault.connect(owner).initialize(
      await registry.getAddress(),
      await yieldRouter.getAddress(),
      owner.address
    );

    // Deploy SDM (nonce+2 from nonceBeforeRegistry — matches sdmAddress)
    const SDMFactory = await hre.ethers.getContractFactory("SelectiveDisclosureModule");
    const sdm = await SDMFactory.connect(owner).deploy(
      await vault.getAddress(),
      await registry.getAddress()
    );

    // Sanity check: SDM address matches precomputed address
    const deployedSdmAddress = await sdm.getAddress();
    if (deployedSdmAddress.toLowerCase() !== sdmAddress.toLowerCase()) {
      throw new Error(
        `SDM address mismatch! Expected ${sdmAddress}, got ${deployedSdmAddress}. ` +
        `Nonce offset is wrong. Adjust nonceBeforeRegistry + N in fixture.`
      );
    }

    return { vault, registry, yieldRouter, sdm, owner, keeper, auditor, otherAuditor };
  }

  describe("grantAuditorAccess", function () {
    it("should grant access and set auditorExpiry", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600; // 1 hour from now
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);

      expect(await sdm.auditorExpiry(auditor.address)).to.equal(futureExpiry);
    });

    it("isAuditorActive returns true for active auditor", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);

      expect(await sdm.isAuditorActive(auditor.address)).to.be.true;
    });

    it("should revert when expiry is in the past", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const pastExpiry = (await time.latest()) - 1;
      await expect(
        sdm.connect(owner).grantAuditorAccess(auditor.address, pastExpiry)
      ).to.be.revertedWith("SDM: expiry in past");
    });

    it("should revert when called by non-vault-owner", async function () {
      const { sdm, keeper, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600;
      await expect(
        sdm.connect(keeper).grantAuditorAccess(auditor.address, futureExpiry)
      ).to.be.revertedWith("SDM: not vault owner");
    });
  });

  describe("revokeAuditorAccess", function () {
    it("should set revocationTimestamp and isAuditorActive returns false", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);

      expect(await sdm.isAuditorActive(auditor.address)).to.be.true;

      await sdm.connect(owner).revokeAuditorAccess(auditor.address);

      expect(await sdm.auditorRevocationTimestamp(auditor.address)).to.be.gt(0n);
      expect(await sdm.isAuditorActive(auditor.address)).to.be.false;
    });

    it("should revert when called by non-vault-owner", async function () {
      const { sdm, keeper, auditor } = await loadFixture(deploySDMFixture);

      await expect(
        sdm.connect(keeper).revokeAuditorAccess(auditor.address)
      ).to.be.revertedWith("SDM: not vault owner");
    });
  });

  describe("requestDecryption", function () {
    it("active auditor can call requestDecryption and emits event", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);

      const fakeHandle = hre.ethers.encodeBytes32String("someHandle");

      await expect(sdm.connect(auditor).requestDecryption(fakeHandle))
        .to.emit(sdm, "DecryptionRequested")
        .withArgs(auditor.address, fakeHandle);
    });

    it("expired auditor cannot requestDecryption", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const soonExpiry = (await time.latest()) + 10; // expires in 10s
      await sdm.connect(owner).grantAuditorAccess(auditor.address, soonExpiry);

      // Advance time past expiry
      await time.increase(20);

      const fakeHandle = hre.ethers.encodeBytes32String("someHandle");
      await expect(
        sdm.connect(auditor).requestDecryption(fakeHandle)
      ).to.be.revertedWith("SDM: access expired");
    });

    it("revoked auditor cannot requestDecryption", async function () {
      const { sdm, owner, auditor } = await loadFixture(deploySDMFixture);

      const futureExpiry = (await time.latest()) + 3600;
      await sdm.connect(owner).grantAuditorAccess(auditor.address, futureExpiry);
      await sdm.connect(owner).revokeAuditorAccess(auditor.address);

      const fakeHandle = hre.ethers.encodeBytes32String("someHandle");
      await expect(
        sdm.connect(auditor).requestDecryption(fakeHandle)
      ).to.be.revertedWith("SDM: access revoked");
    });
  });
});
