// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {ITaskManager} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import "./EncryptedStrategyRegistry.sol";

address constant TASK_MANAGER = 0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9;

contract SelectiveDisclosureModule {
    address public immutable vault;
    EncryptedStrategyRegistry public immutable registry;

    mapping(address => uint256) public auditorExpiry;
    mapping(address => uint256) public auditorRevocationTimestamp;

    event AuditorAccessGranted(address indexed auditor, uint256 expiry);
    event AuditorAccessRevoked(address indexed auditor);
    event DecryptionRequested(address indexed auditor, bytes32 valueHandle);

    constructor(address _vault, address _registry) {
        vault = _vault;
        registry = EncryptedStrategyRegistry(_registry);
    }

    function _isVaultOwner(address account) internal view returns (bool) {
        (bool ok, bytes memory data) = vault.staticcall(abi.encodeWithSignature("owner()"));
        if (!ok || data.length == 0) return false;
        return abi.decode(data, (address)) == account;
    }

    function grantAuditorAccess(address auditor, uint256 expiryTimestamp) external {
        require(_isVaultOwner(msg.sender), "SDM: not vault owner");
        require(expiryTimestamp > block.timestamp, "SDM: expiry in past");

        auditorExpiry[auditor] = expiryTimestamp;
        auditorRevocationTimestamp[auditor] = 0;

        // Grant FHE access on all strategy weights via registry
        registry.allowAuditor(auditor);

        emit AuditorAccessGranted(auditor, expiryTimestamp);
    }

    function revokeAuditorAccess(address auditor) external {
        require(_isVaultOwner(msg.sender), "SDM: not vault owner");
        // FHE allow is append-only — record revocation timestamp
        // Future encrypted values will not include auditor in FHE.allow calls
        auditorRevocationTimestamp[auditor] = block.timestamp;
        emit AuditorAccessRevoked(auditor);
    }

    function isAuditorActive(address auditor) external view returns (bool) {
        return auditorExpiry[auditor] > block.timestamp && auditorRevocationTimestamp[auditor] == 0;
    }

    // Step 1: Auditor requests decryption — allows public access on specific handle
    // In practice, auditor calls this to mark a handle for decryption by the threshold network
    function requestDecryption(bytes32 valueHandle) external {
        require(auditorExpiry[msg.sender] > block.timestamp, "SDM: access expired");
        require(auditorRevocationTimestamp[msg.sender] == 0, "SDM: access revoked");
        // The auditor already has FHE.allow on the handle (granted via grantAuditorAccess)
        // They use their off-chain key to decrypt — no on-chain action needed for threshold decrypt
        emit DecryptionRequested(msg.sender, valueHandle);
    }

    // Step 2: Publish decryption result (auditor submits plaintext + signature after off-chain decrypt)
    function publishDecryptionResult(bytes32 ctHash, uint256 plaintext, bytes calldata signature) external {
        require(auditorExpiry[msg.sender] > block.timestamp, "SDM: access expired");
        ITaskManager(TASK_MANAGER).publishDecryptResult(uint256(ctHash), plaintext, signature);
    }

    // Step 3: Retrieve decrypted value (available after publishDecryptionResult)
    function retrieveDecryption(bytes32 valueHandle) external view returns (uint256 value, bool decrypted) {
        return ITaskManager(TASK_MANAGER).getDecryptResultSafe(uint256(valueHandle));
    }
}
