// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./interfaces/IStrategy.sol";
import "./EncryptedStrategyRegistry.sol";
import "./YieldRouter.sol";

contract PrivateComposableVault is ERC4626, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public keeper;
    address public emergencyAdmin;
    address public rebalancer;

    address public donationAddress;

    EncryptedStrategyRegistry public registry;
    YieldRouter public yieldRouter;

    // Encrypted vault creator fee (basis points) — only owner can read
    euint16 private _creatorFee;

    uint256 public totalPrincipal;

    // Per-strategy accounting
    mapping(address => uint256) public strategyDebt; // last reported assets
    address[] private _strategies; // plaintext list mirrors registry

    bool public depositsPaused;
    bool public withdrawalsPaused;

    uint256 public constant MAX_BPS = 10_000;

    event StrategyDeployed(address indexed strategy, uint256 amount);
    event StrategyWithdrawn(address indexed strategy, uint256 amount);
    event StrategyReported(address indexed strategy, uint256 totalAssets, uint256 profit, uint256 loss);
    event YieldDonated(uint256 shares, address indexed donationAddr);
    event RebalanceExecuted(address indexed strategy, uint256 amount, bool isWithdraw);

    modifier onlyOwner() {
        require(msg.sender == owner, "PCV: not owner");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner, "PCV: not keeper");
        _;
    }

    modifier onlyRebalancer() {
        require(msg.sender == rebalancer, "PCV: not rebalancer");
        _;
    }

    modifier whenDepositsNotPaused() {
        require(!depositsPaused, "PCV: deposits paused");
        _;
    }

    modifier whenWithdrawalsNotPaused() {
        require(!withdrawalsPaused, "PCV: withdrawals paused");
        _;
    }

    constructor(
        address _asset,
        string memory _name,
        string memory _symbol,
        address _owner,
        address _keeper,
        address _emergencyAdmin,
        address _donationAddress,
        InEuint16 memory _creatorFeeEncrypted
    ) ERC4626(IERC20(_asset)) ERC20(_name, _symbol) {
        owner = _owner;
        keeper = _keeper;
        emergencyAdmin = _emergencyAdmin;
        donationAddress = _donationAddress;

        // Store encrypted fee — only readable by owner via FHE
        _creatorFee = FHE.asEuint16(_creatorFeeEncrypted);
        FHE.allowThis(_creatorFee);
        FHE.allow(_creatorFee, _owner);
    }

    // Called by factory after deploying all modules
    function initialize(address _registry, address _yieldRouter, address _rebalancer) external {
        require(address(registry) == address(0), "PCV: already initialized");
        require(msg.sender == owner, "PCV: not owner");
        registry = EncryptedStrategyRegistry(_registry);
        yieldRouter = YieldRouter(_yieldRouter);
        rebalancer = _rebalancer;
        _approve(address(this), address(yieldRouter), type(uint256).max);
    }

    // ===== ERC-4626 Overrides =====

    // Principal-only totalAssets: strategies' current value + cash in vault
    function totalAssets() public view override returns (uint256) {
        uint256 cash = IERC20(asset()).balanceOf(address(this));
        uint256 strategyTotal = 0;
        for (uint256 i = 0; i < _strategies.length; i++) {
            strategyTotal += IStrategy(_strategies[i]).totalAssets();
        }
        return cash + strategyTotal;
    }

    function strategyCount() external view returns (uint256) {
        return _strategies.length;
    }

    function pricePerShare() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18;
        return totalAssets() * 1e18 / supply;
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override whenDepositsNotPaused nonReentrant {
        totalPrincipal += assets;
        super._deposit(caller, receiver, assets, shares);
    }

    function _withdraw(
        address caller,
        address receiver,
        address _owner2,
        uint256 assets,
        uint256 shares
    ) internal override whenWithdrawalsNotPaused nonReentrant {
        require(totalPrincipal >= assets, "PCV: principal underflow");
        totalPrincipal -= assets;
        super._withdraw(caller, receiver, _owner2, assets, shares);
    }

    // ===== Strategy Management =====

    function addStrategy(address strategy) external onlyOwner {
        require(strategy != address(0), "PCV: zero address");
        require(registry.isStrategyRegistered(strategy), "PCV: not in registry");
        _strategies.push(strategy);
    }

    function deployToStrategy(address strategy, uint256 amount) external onlyKeeper {
        require(_isStrategy(strategy), "PCV: not a strategy");
        require(IERC20(asset()).balanceOf(address(this)) >= amount, "PCV: insufficient cash");

        IERC20(asset()).forceApprove(strategy, amount);
        IStrategy(strategy).deployFunds(amount);
        strategyDebt[strategy] += amount;
        registry.setTotalDebt(strategy, uint128(strategyDebt[strategy]));

        emit StrategyDeployed(strategy, amount);
    }

    function withdrawFromStrategy(address strategy, uint256 amount) external onlyKeeper {
        require(_isStrategy(strategy), "PCV: not a strategy");
        IStrategy(strategy).freeFunds(amount);
        strategyDebt[strategy] = strategyDebt[strategy] >= amount ? strategyDebt[strategy] - amount : 0;
        registry.setTotalDebt(strategy, uint128(strategyDebt[strategy]));

        emit StrategyWithdrawn(strategy, amount);
    }

    // Called by PrivateRebalancer
    function rebalanceStrategy(address strategy, uint256 amount, bool isWithdraw) external onlyRebalancer {
        require(_isStrategy(strategy), "PCV: not a strategy");
        if (isWithdraw) {
            IStrategy(strategy).freeFunds(amount);
            strategyDebt[strategy] = strategyDebt[strategy] >= amount ? strategyDebt[strategy] - amount : 0;
        } else {
            require(IERC20(asset()).balanceOf(address(this)) >= amount, "PCV: insufficient cash");
            IERC20(asset()).forceApprove(strategy, amount);
            IStrategy(strategy).deployFunds(amount);
            strategyDebt[strategy] += amount;
        }
        registry.setTotalDebt(strategy, uint128(strategyDebt[strategy]));
        emit RebalanceExecuted(strategy, amount, isWithdraw);
    }

    // ===== Keeper Report =====

    function report(address strategy) external onlyKeeper {
        require(_isStrategy(strategy), "PCV: not a strategy");

        uint256 previousDebt = strategyDebt[strategy];
        uint256 currentAssets = IStrategy(strategy).harvestAndReport();

        uint256 profit = 0;
        uint256 loss = 0;

        if (currentAssets > previousDebt) {
            profit = currentAssets - previousDebt;
            // Mint donation shares for the profit
            uint256 sharesToDonate = _computeDonationShares(profit);
            if (sharesToDonate > 0) {
                _mint(address(yieldRouter), sharesToDonate);
                yieldRouter.routeYield(sharesToDonate);
                emit YieldDonated(sharesToDonate, donationAddress);
            }
        } else if (currentAssets < previousDebt) {
            loss = previousDebt - currentAssets;
            _handleLoss(loss);
        }

        strategyDebt[strategy] = currentAssets;
        registry.setTotalDebt(strategy, uint128(currentAssets));

        emit StrategyReported(strategy, currentAssets, profit, loss);
    }

    function _computeDonationShares(uint256 profit) internal view returns (uint256) {
        uint256 supply = totalSupply();
        uint256 assets = totalAssets();
        if (supply == 0 || assets == 0) return profit;
        // shares = profit * supply / assets  (standard ERC4626 convertToShares math)
        return profit * supply / assets;
    }

    function _handleLoss(uint256 loss) internal {
        uint256 donationShares = balanceOf(address(yieldRouter));
        if (donationShares == 0) return;

        uint256 supply = totalSupply();
        uint256 assets = totalAssets();
        uint256 donationValue = donationShares * assets / supply;

        if (loss <= donationValue) {
            // Burn enough donation shares to cover loss
            uint256 sharesToBurn = loss * supply / assets;
            _burn(address(yieldRouter), sharesToBurn);
        } else {
            // Burn all donation shares; remaining loss lowers PPS
            _burn(address(yieldRouter), donationShares);
        }
    }

    // ===== Owner Access to Encrypted Fee =====

    function getCreatorFee() external onlyOwner returns (euint16) {
        FHE.allowSender(_creatorFee);
        return _creatorFee;
    }

    // ===== Emergency =====

    function pauseDeposits() external {
        require(msg.sender == emergencyAdmin || msg.sender == owner, "PCV: not authorized");
        depositsPaused = true;
    }

    function unpauseDeposits() external {
        require(msg.sender == emergencyAdmin || msg.sender == owner, "PCV: not authorized");
        depositsPaused = false;
    }

    function pauseWithdrawals() external {
        require(msg.sender == emergencyAdmin || msg.sender == owner, "PCV: not authorized");
        withdrawalsPaused = true;
    }

    function unpauseWithdrawals() external {
        require(msg.sender == emergencyAdmin || msg.sender == owner, "PCV: not authorized");
        withdrawalsPaused = false;
    }

    function _isStrategy(address strategy) internal view returns (bool) {
        for (uint256 i = 0; i < _strategies.length; i++) {
            if (_strategies[i] == strategy) return true;
        }
        return false;
    }
}
