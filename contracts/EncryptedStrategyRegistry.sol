// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract EncryptedStrategyRegistry {
    struct StrategyEntry {
        address addr;
        euint16 weight;
        ebool active;
        euint128 totalDebt;
    }

    StrategyEntry[] private _entries;
    mapping(address => uint256) private _strategyIndex; // 1-indexed

    euint16 private _weightSum;

    address public vault;
    address public owner;
    address public rebalancer;
    address public factory;
    uint256 public immutable maxStrategies;

    event StrategyAdded(address indexed strategy, uint256 index);
    event StrategyRemoved(address indexed strategy);
    event WeightUpdated(address indexed strategy);
    event AuditorAllowed(address indexed auditor);

    modifier onlyOwner() {
        require(msg.sender == owner, "ESR: not owner");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "ESR: not vault");
        _;
    }

    modifier onlyVaultOrFactory() {
        require(msg.sender == vault || msg.sender == factory, "ESR: unauthorized");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == vault || msg.sender == rebalancer || msg.sender == owner,
            "ESR: unauthorized"
        );
        _;
    }

    constructor(address _vault, address _owner, uint256 _maxStrategies, address _factory) {
        vault = _vault;
        owner = _owner;
        factory = _factory;
        maxStrategies = _maxStrategies;
        _weightSum = FHE.asEuint16(0);
        FHE.allowThis(_weightSum);
    }

    function setRebalancer(address _rebalancer) external onlyVaultOrFactory {
        require(rebalancer == address(0), "ESR: rebalancer already set");
        rebalancer = _rebalancer;
    }

    function strategyCount() external view returns (uint256) {
        return _entries.length;
    }

    function getStrategyAddress(uint256 index) external view returns (address) {
        require(index < _entries.length, "ESR: index out of bounds");
        return _entries[index].addr;
    }

    // Returns all strategy addresses (plaintext). Active flag is encrypted.
    function getAllStrategyAddresses() external view returns (address[] memory addrs) {
        addrs = new address[](_entries.length);
        for (uint256 i = 0; i < _entries.length; i++) {
            addrs[i] = _entries[i].addr;
        }
    }

    function addStrategy(address strategy, InEuint16 calldata encWeight) external onlyOwner {
        require(_entries.length < maxStrategies, "ESR: max strategies reached");
        require(strategy != address(0), "ESR: zero address");
        require(_strategyIndex[strategy] == 0, "ESR: strategy exists");

        euint16 weight = FHE.asEuint16(encWeight);
        ebool active = FHE.asEbool(true);
        euint128 debt = FHE.asEuint128(0);

        _weightSum = FHE.add(_weightSum, weight);

        FHE.allowThis(weight);
        FHE.allowThis(active);
        FHE.allowThis(debt);
        FHE.allowThis(_weightSum);
        FHE.allowSender(weight); // allow owner to read their own weight

        _entries.push(StrategyEntry(strategy, weight, active, debt));
        _strategyIndex[strategy] = _entries.length; // 1-indexed

        emit StrategyAdded(strategy, _entries.length - 1);
    }

    function removeStrategy(address strategy) external onlyOwner {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");

        StrategyEntry storage entry = _entries[idx - 1];

        // Subtract weight from sum before marking inactive
        _weightSum = FHE.sub(_weightSum, entry.weight);
        entry.active = FHE.asEbool(false);

        FHE.allowThis(entry.active);
        FHE.allowThis(_weightSum);

        emit StrategyRemoved(strategy);
    }

    function updateWeight(address strategy, InEuint16 calldata encNewWeight) external onlyOwner {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");

        StrategyEntry storage entry = _entries[idx - 1];

        // Adjust sum: sum = sum - oldWeight + newWeight
        euint16 newWeight = FHE.asEuint16(encNewWeight);
        _weightSum = FHE.sub(_weightSum, entry.weight);
        _weightSum = FHE.add(_weightSum, newWeight);
        entry.weight = newWeight;

        FHE.allowThis(entry.weight);
        FHE.allowThis(_weightSum);
        FHE.allowSender(entry.weight);

        emit WeightUpdated(strategy);
    }

    // Returns encrypted weight — only authorized callers (vault, rebalancer, owner)
    function getWeight(address strategy) external onlyAuthorized returns (euint16) {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");
        euint16 w = _entries[idx - 1].weight;
        FHE.allowSender(w);
        return w;
    }

    // Returns encrypted active flag — only authorized callers
    function getActive(address strategy) external onlyAuthorized returns (ebool) {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");
        ebool a = _entries[idx - 1].active;
        FHE.allowSender(a);
        return a;
    }

    // Returns encrypted total debt — only authorized callers
    function getTotalDebt(address strategy) external onlyAuthorized returns (euint128) {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");
        euint128 d = _entries[idx - 1].totalDebt;
        FHE.allowSender(d);
        return d;
    }

    // Vault updates debt after deploying/freeing funds
    function setTotalDebt(address strategy, uint128 plainDebt) external onlyVault {
        uint256 idx = _strategyIndex[strategy];
        require(idx != 0, "ESR: strategy not found");
        _entries[idx - 1].totalDebt = FHE.asEuint128(plainDebt);
        FHE.allowThis(_entries[idx - 1].totalDebt);
    }

    // Owner gets encrypted weight sum (can decrypt off-chain to verify == 10000)
    function getWeightSum() external onlyOwner returns (euint16) {
        FHE.allowSender(_weightSum);
        return _weightSum;
    }

    // Grant auditor FHE.allow on all active weight handles
    function allowAuditor(address auditor) external onlyOwner {
        for (uint256 i = 0; i < _entries.length; i++) {
            FHE.allow(_entries[i].weight, auditor);
            FHE.allow(_entries[i].active, auditor);
        }
        FHE.allow(_weightSum, auditor);
        emit AuditorAllowed(auditor);
    }

    function isStrategyRegistered(address strategy) external view returns (bool) {
        return _strategyIndex[strategy] != 0;
    }
}
