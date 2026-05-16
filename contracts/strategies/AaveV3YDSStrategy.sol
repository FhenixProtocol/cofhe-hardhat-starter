// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BaseStrategy.sol";
import "../interfaces/IAaveV3Pool.sol";

/// @title AaveV3YDSStrategy
/// @notice YDS (Yield Donation Strategy): deposits underlying into Aave, earns interest,
///         on report sends interest back to vault which mints donation shares.
contract AaveV3YDSStrategy is BaseStrategy {
    using SafeERC20 for IERC20;

    IAaveV3Pool public immutable aavePool;
    address public immutable aToken;

    constructor(
        address _asset,
        address _vault,
        address _management,
        address _keeper,
        address _emergencyAdmin,
        address _aavePool
    ) BaseStrategy(_asset, _vault, _management, _keeper, _emergencyAdmin) {
        aavePool = IAaveV3Pool(_aavePool);
        // Get aToken address from Aave pool
        IAaveV3Pool.ReserveData memory reserveData = IAaveV3Pool(_aavePool).getReserveData(_asset);
        aToken = reserveData.aTokenAddress;

        // Approve pool to spend asset
        IERC20(_asset).forceApprove(_aavePool, type(uint256).max);
    }

    function _deployFunds(uint256 amount) internal override {
        aavePool.supply(asset, amount, address(this), 0);
    }

    function _freeFunds(uint256 amount) internal override {
        aavePool.withdraw(asset, amount, address(this));
    }

    function _harvestAndReport() internal override returns (uint256) {
        // aToken balance is 1:1 with underlying (Aave V3 with rebasing aTokens)
        return IAToken(aToken).balanceOf(address(this));
    }

    function _totalAssets() internal view override returns (uint256) {
        return IAToken(aToken).balanceOf(address(this));
    }

    /// @notice Emergency: withdraw all from Aave back to vault
    function emergencyWithdrawAll() external onlyEmergencyAdmin {
        uint256 balance = IAToken(aToken).balanceOf(address(this));
        if (balance > 0) {
            aavePool.withdraw(asset, type(uint256).max, vault);
        }
    }
}
