// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BaseStrategy.sol";
import "../interfaces/IAaveV3Pool.sol";

/// @title AaveV3YSSStrategy
/// @notice YSS (Yield Skimming Strategy): holds aTokens directly.
///         Exchange rate appreciation is skimmed to vault on each report.
///         Users deposit underlying asset → strategy supplies to Aave → holds aTokens.
///         On report: aToken balance > deposited amount → skim the excess to vault.
contract AaveV3YSSStrategy is BaseStrategy {
    using SafeERC20 for IERC20;

    IAaveV3Pool public immutable aavePool;
    address public immutable aToken;

    uint256 public lastNormalizedIncome; // tracks exchange rate for YSS skimming

    constructor(
        address _asset,
        address _vault,
        address _management,
        address _keeper,
        address _emergencyAdmin,
        address _aavePool
    ) BaseStrategy(_asset, _vault, _management, _keeper, _emergencyAdmin) {
        aavePool = IAaveV3Pool(_aavePool);
        IAaveV3Pool.ReserveData memory reserveData = IAaveV3Pool(_aavePool).getReserveData(_asset);
        aToken = reserveData.aTokenAddress;
        lastNormalizedIncome = IAaveV3Pool(_aavePool).getReserveNormalizedIncome(_asset);
        IERC20(_asset).forceApprove(_aavePool, type(uint256).max);
    }

    function _deployFunds(uint256 amount) internal override {
        aavePool.supply(asset, amount, address(this), 0);
    }

    function _freeFunds(uint256 amount) internal override {
        aavePool.withdraw(asset, amount, address(this));
    }

    function _harvestAndReport() internal override returns (uint256) {
        uint256 currentIncome = aavePool.getReserveNormalizedIncome(asset);
        uint256 aTokenBalance = IAToken(aToken).balanceOf(address(this));

        if (currentIncome > lastNormalizedIncome && totalDebt > 0) {
            // Yield = appreciation in exchange rate * principal balance
            // aToken is 1:1 with underlying, so gain = aTokenBalance - totalDebt
            uint256 gain = aTokenBalance > totalDebt ? aTokenBalance - totalDebt : 0;

            if (gain > 0) {
                // Withdraw just the gain and transfer to vault for donation routing
                aavePool.withdraw(asset, gain, vault);
            }
        }

        lastNormalizedIncome = currentIncome;

        // After skimming, our aToken balance should equal totalDebt
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
