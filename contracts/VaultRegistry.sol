// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract VaultRegistry {
    struct VaultMetadata {
        address asset;
        string name;
        string symbol;
        address creator;
        uint256 createdAt;
    }

    address[] public vaults;
    mapping(address => VaultMetadata) public vaultMetadata;
    mapping(address => bool) public isVault;

    address public factory;
    address public deployer;
    bool public factorySet;

    event VaultRegistered(address indexed vault, address indexed asset, address indexed creator);
    event FactorySet(address indexed factory);

    modifier onlyFactory() {
        require(msg.sender == factory, "VaultRegistry: not factory");
        _;
    }

    constructor() {
        deployer = msg.sender;
    }

    function setFactory(address _factory) external {
        require(msg.sender == deployer, "VaultRegistry: not deployer");
        require(!factorySet, "VaultRegistry: factory already set");
        require(_factory != address(0), "VaultRegistry: zero address");
        factory = _factory;
        factorySet = true;
        emit FactorySet(_factory);
    }

    function register(
        address vault,
        address asset,
        string memory name,
        string memory symbol,
        address creator
    ) external onlyFactory {
        require(!isVault[vault], "VaultRegistry: already registered");
        vaults.push(vault);
        isVault[vault] = true;
        vaultMetadata[vault] = VaultMetadata(asset, name, symbol, creator, block.timestamp);
        emit VaultRegistered(vault, asset, creator);
    }

    function getAllVaults() external view returns (address[] memory) {
        return vaults;
    }

    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    // Returns live public data from vault (totalPrincipal, strategyCount)
    function getVaultMetadata(address vault) external view returns (
        VaultMetadata memory meta,
        uint256 totalPrincipal,
        uint256 strategyCount
    ) {
        require(isVault[vault], "VaultRegistry: not a vault");
        meta = vaultMetadata[vault];
        (bool ok1, bytes memory d1) = vault.staticcall(abi.encodeWithSignature("totalPrincipal()"));
        totalPrincipal = ok1 ? abi.decode(d1, (uint256)) : 0;
        (bool ok2, bytes memory d2) = vault.staticcall(abi.encodeWithSignature("strategyCount()"));
        strategyCount = ok2 ? abi.decode(d2, (uint256)) : 0;
    }
}
