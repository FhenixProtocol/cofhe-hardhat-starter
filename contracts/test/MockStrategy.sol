// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategy.sol";

contract MockStrategy is IStrategy {
    using SafeERC20 for IERC20;

    address public immutable override asset;
    address public immutable override vault;
    address public override management;
    address public override keeper;
    address public override emergencyAdmin;

    uint256 public mockTotalAssets;
    uint256 public deployedAmount;
    bool private _active = true;

    constructor(address _asset, address _vault) {
        asset = _asset;
        vault = _vault;
        management = msg.sender;
        keeper = msg.sender;
        emergencyAdmin = msg.sender;
    }

    function setMockTotalAssets(uint256 amount) external {
        mockTotalAssets = amount;
    }

    function deployFunds(uint256 amount) external override {
        IERC20(asset).safeTransferFrom(vault, address(this), amount);
        deployedAmount += amount;
        if (mockTotalAssets == 0) mockTotalAssets = amount;
    }

    function freeFunds(uint256 amount) external override {
        IERC20(asset).safeTransfer(vault, amount);
        deployedAmount = deployedAmount >= amount ? deployedAmount - amount : 0;
    }

    function harvestAndReport() external override returns (uint256) {
        return mockTotalAssets;
    }

    function totalAssets() external view override returns (uint256) {
        return mockTotalAssets;
    }

    function isActive() external view override returns (bool) {
        return _active;
    }
}
