// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategy.sol";

abstract contract BaseStrategy is IStrategy {
    using SafeERC20 for IERC20;

    address public immutable override asset;
    address public immutable override vault;
    address public override management;
    address public override keeper;
    address public override emergencyAdmin;

    bool private _active;
    bool public paused;

    uint256 public totalDebt; // total assets deployed from vault

    event FundsDeployed(uint256 amount);
    event FundsFreed(uint256 amount);
    event Harvested(uint256 totalAssets, uint256 profit, uint256 loss);

    modifier onlyVault() {
        require(msg.sender == vault || msg.sender == management, "BS: not vault/management");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == management, "BS: not keeper");
        _;
    }

    modifier onlyEmergencyAdmin() {
        require(msg.sender == emergencyAdmin, "BS: not emergency admin");
        _;
    }

    modifier notPaused() {
        require(!paused, "BS: paused");
        _;
    }

    constructor(
        address _asset,
        address _vault,
        address _management,
        address _keeper,
        address _emergencyAdmin
    ) {
        asset = _asset;
        vault = _vault;
        management = _management;
        keeper = _keeper;
        emergencyAdmin = _emergencyAdmin;
        _active = true;
    }

    function isActive() external view override returns (bool) {
        return _active;
    }

    function deployFunds(uint256 amount) external override onlyVault notPaused {
        require(amount > 0, "BS: zero amount");
        IERC20(asset).safeTransferFrom(vault, address(this), amount);
        totalDebt += amount;
        _deployFunds(amount);
        emit FundsDeployed(amount);
    }

    function freeFunds(uint256 amount) external override onlyVault {
        require(amount <= totalDebt, "BS: amount exceeds debt");
        _freeFunds(amount);
        totalDebt -= amount;
        IERC20(asset).safeTransfer(vault, amount);
        emit FundsFreed(amount);
    }

    function harvestAndReport() external override onlyKeeper returns (uint256) {
        uint256 currentAssets = _harvestAndReport();

        uint256 profit = 0;
        uint256 loss = 0;
        if (currentAssets >= totalDebt) {
            profit = currentAssets - totalDebt;
        } else {
            loss = totalDebt - currentAssets;
        }

        emit Harvested(currentAssets, profit, loss);
        return currentAssets;
    }

    function totalAssets() external view override returns (uint256) {
        return _totalAssets();
    }

    function pause() external onlyEmergencyAdmin {
        paused = true;
    }

    function unpause() external onlyEmergencyAdmin {
        paused = false;
    }

    function setKeeper(address newKeeper) external {
        require(msg.sender == management, "BS: not management");
        keeper = newKeeper;
    }

    // Internal hooks — implement in subclasses
    function _deployFunds(uint256 amount) internal virtual;
    function _freeFunds(uint256 amount) internal virtual;
    function _harvestAndReport() internal virtual returns (uint256 totalAssetsAfterHarvest);
    function _totalAssets() internal view virtual returns (uint256);
}
