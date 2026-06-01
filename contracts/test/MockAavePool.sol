// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MockERC20.sol";

/// @title MockAavePool
/// @notice Mock Aave V3 Pool for testing. Simulates basic Aave functionality.
/// In production, this would be replaced by the real Aave Pool at:
/// - Arbitrum: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
contract MockAavePool {
    using SafeERC20 for IERC20;

    address public immutable asset;
    address public immutable aToken;
    
    uint256 public normalizedIncome = 1e27; // 1.0 in ray (1e27)
    
    mapping(address => uint256) private _aTokenBalances;
    
    struct ReserveData {
        uint256 configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }

    constructor(address _asset) {
        asset = _asset;
        // Deploy mock aToken (18 decimals)
        MockERC20 mockAToken = new MockERC20("Aave USDC", "aUSDC", 18);
        aToken = address(mockAToken);
    }

    function setNormalizedIncome(uint256 _normalizedIncome) external {
        normalizedIncome = _normalizedIncome;
    }

    function getReserveData(address) external view returns (ReserveData memory) {
        ReserveData memory data;
        data.aTokenAddress = aToken;
        data.liquidityIndex = 1e27;
        data.currentLiquidityRate = 30000000000000000000000000; // ~3% APY in ray
        data.lastUpdateTimestamp = uint40(block.timestamp);
        return data;
    }

    function getReserveNormalizedIncome(address) external view returns (uint256) {
        return normalizedIncome;
    }

    function supply(
        address _asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external {
        require(_asset == asset, "MockAavePool: wrong asset");
        
        // Transfer from caller
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), amount);
        
        // Mint aTokens to onBehalfOf (1:1 ratio)
        _aTokenBalances[onBehalfOf] += amount;
        MockERC20(aToken).mint(onBehalfOf, amount);
    }

    function withdraw(
        address _asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        require(_asset == asset, "MockAavePool: wrong asset");
        
        // Burn aTokens from caller
        require(_aTokenBalances[msg.sender] >= amount, "MockAavePool: insufficient balance");
        _aTokenBalances[msg.sender] -= amount;
        MockERC20(aToken).burn(msg.sender, amount);
        
        // Return underlying to 'to'
        IERC20(_asset).safeTransfer(to, amount);
        
        return amount;
    }

    function getATokenBalance(address account) external view returns (uint256) {
        return _aTokenBalances[account];
    }
}