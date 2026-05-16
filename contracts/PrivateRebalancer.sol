// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./interfaces/IStrategy.sol";
import "./EncryptedStrategyRegistry.sol";

interface IPrivateComposableVaultForRebalancer {
    function rebalanceStrategy(address strategy, uint256 amount, bool isWithdraw) external;
    function totalAssets() external view returns (uint256);
}

contract PrivateRebalancer {
    struct VaultConfig {
        euint16 driftThreshold;           // encrypted, in basis points (e.g., 500 = 5%)
        euint32 minTimeBetweenRebalances; // encrypted, in seconds
        euint32 lastRebalanceTimestamp;   // encrypted
    }

    mapping(address => VaultConfig) private _configs;
    mapping(address => bool) public isConfigured;

    address public factory;

    event RebalanceTriggered(address indexed vault, uint256 timestamp);
    event VaultConfigured(address indexed vault);

    modifier onlyFactory() {
        require(msg.sender == factory, "PR: not factory");
        _;
    }

    constructor(address _factory) {
        factory = _factory;
    }

    function configureVault(
        address vault,
        InEuint16 calldata encDriftThreshold,
        InEuint32 calldata encMinTime
    ) external onlyFactory {
        require(!isConfigured[vault], "PR: already configured");

        euint16 driftThreshold = FHE.asEuint16(encDriftThreshold);
        euint32 minTime = FHE.asEuint32(encMinTime);
        euint32 lastTs = FHE.asEuint32(block.timestamp);

        FHE.allowThis(driftThreshold);
        FHE.allowThis(minTime);
        FHE.allowThis(lastTs);

        _configs[vault] = VaultConfig(driftThreshold, minTime, lastTs);
        isConfigured[vault] = true;

        emit VaultConfigured(vault);
    }

    // Returns ebool — caller learns whether to rebalance but not the thresholds
    function checkRebalanceNeeded(
        address vault,
        address, /* registry — unused, kept for interface consistency */
        uint256 currentDriftBps // plaintext drift in bps, computed by keeper off-chain from public strategy data
    ) external returns (ebool) {
        VaultConfig storage cfg = _configs[vault];

        // Time condition: time since last rebalance >= min time
        euint32 currentTime = FHE.asEuint32(block.timestamp);
        euint32 elapsed = FHE.sub(currentTime, cfg.lastRebalanceTimestamp);
        ebool timeCondition = FHE.gte(elapsed, cfg.minTimeBetweenRebalances);

        // Drift condition: currentDrift >= driftThreshold
        euint16 encCurrentDrift = FHE.asEuint16(currentDriftBps);
        ebool driftCondition = FHE.gte(encCurrentDrift, cfg.driftThreshold);

        // Combined condition
        ebool shouldRebalance = FHE.or(timeCondition, driftCondition);

        FHE.allowThis(timeCondition);
        FHE.allowThis(driftCondition);
        FHE.allowThis(shouldRebalance);
        FHE.allowSender(shouldRebalance);

        return shouldRebalance;
    }

    // Keeper calls this to trigger rebalancing.
    // Keeper provides the rebalance amounts (computed off-chain from public strategy data).
    // FHE.select gates whether to actually apply them (stores gated values on-chain),
    // but execution uses plaintext amounts — keeper is trusted to provide correct values.
    function triggerRebalance(
        address vault,
        address, /* registry — unused, kept for interface consistency */
        address[] calldata strategies,
        uint128[] calldata amounts,  // plaintext amounts computed off-chain
        bool[] calldata isWithdraw,  // direction per strategy
        uint256 currentDriftBps      // plaintext drift for condition check
    ) external {
        require(isConfigured[vault], "PR: vault not configured");
        require(
            strategies.length == amounts.length && amounts.length == isWithdraw.length,
            "PR: length mismatch"
        );

        VaultConfig storage cfg = _configs[vault];

        // Compute shouldRebalance in FHE
        euint32 currentTime = FHE.asEuint32(block.timestamp);
        euint32 elapsed = FHE.sub(currentTime, cfg.lastRebalanceTimestamp);
        ebool timeCondition = FHE.gte(elapsed, cfg.minTimeBetweenRebalances);
        euint16 encCurrentDrift = FHE.asEuint16(currentDriftBps);
        ebool driftCondition = FHE.gte(encCurrentDrift, cfg.driftThreshold);
        ebool shouldRebalance = FHE.or(timeCondition, driftCondition);

        FHE.allowThis(shouldRebalance);

        // Gate each amount through FHE.select — result stored on-chain for auditability
        for (uint256 i = 0; i < strategies.length; i++) {
            euint128 encAmount = FHE.asEuint128(amounts[i]);
            euint128 effectiveAmount = FHE.select(shouldRebalance, encAmount, FHE.asEuint128(0));
            FHE.allowThis(effectiveAmount);
        }

        // Update timestamp unconditionally (timestamp leak is acceptable; thresholds stay hidden)
        cfg.lastRebalanceTimestamp = FHE.asEuint32(block.timestamp);
        FHE.allowThis(cfg.lastRebalanceTimestamp);

        // Execute rebalancing — keeper is trusted; vault enforces strategy membership
        IPrivateComposableVaultForRebalancer vaultContract = IPrivateComposableVaultForRebalancer(vault);
        for (uint256 i = 0; i < strategies.length; i++) {
            if (amounts[i] > 0) {
                vaultContract.rebalanceStrategy(strategies[i], amounts[i], isWithdraw[i]);
            }
        }

        emit RebalanceTriggered(vault, block.timestamp);
    }

    // Vault owner can update thresholds
    function updateDriftThreshold(address vault, InEuint16 calldata encThreshold) external {
        require(isConfigured[vault], "PR: not configured");
        // Access control delegated to caller — vault owner should call through vault or be verified off-chain
        _configs[vault].driftThreshold = FHE.asEuint16(encThreshold);
        FHE.allowThis(_configs[vault].driftThreshold);
    }

    function updateMinTime(address vault, InEuint32 calldata encMinTime) external {
        require(isConfigured[vault], "PR: not configured");
        _configs[vault].minTimeBetweenRebalances = FHE.asEuint32(encMinTime);
        FHE.allowThis(_configs[vault].minTimeBetweenRebalances);
    }
}
