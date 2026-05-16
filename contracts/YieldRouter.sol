// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAllocationMechanism.sol";

contract YieldRouter {
    using SafeERC20 for IERC20;

    address public immutable vault;          // ERC-4626 vault (shares token)
    IAllocationMechanism public immutable allocationMechanism;

    // epoch → recipient → claimable shares
    mapping(uint256 => mapping(address => uint256)) public claimable;
    uint256 public currentEpoch;
    uint256 public totalRoutedShares;

    event YieldRouted(uint256 indexed epoch, uint256 totalShares, uint256 recipientCount);
    event Claimed(address indexed recipient, uint256 epoch, uint256 shares);

    modifier onlyVault() {
        require(msg.sender == vault, "YR: not vault");
        _;
    }

    constructor(address _vault, address _mechanism) {
        vault = _vault;
        allocationMechanism = IAllocationMechanism(_mechanism);
    }

    // Called by vault during report() — shares have already been minted to this contract
    function routeYield(uint256 sharesToRoute) external onlyVault {
        if (sharesToRoute == 0) return;

        (address[] memory recipients, uint256[] memory weights) = allocationMechanism.getRecipients();
        uint256 total = allocationMechanism.totalWeight();
        require(total > 0, "YR: no weight");

        uint256 recipientCount = recipients.length;
        uint256 distributed = 0;

        for (uint256 i = 0; i < recipientCount; i++) {
            uint256 share = sharesToRoute * weights[i] / total;
            claimable[currentEpoch][recipients[i]] += share;
            distributed += share;
        }

        // Any rounding remainder goes to first recipient
        if (distributed < sharesToRoute && recipientCount > 0) {
            claimable[currentEpoch][recipients[0]] += sharesToRoute - distributed;
        }

        totalRoutedShares += sharesToRoute;
        emit YieldRouted(currentEpoch, sharesToRoute, recipientCount);
    }

    function advanceEpoch() external onlyVault {
        currentEpoch++;
    }

    function claim(uint256 epoch) external {
        uint256 shares = claimable[epoch][msg.sender];
        require(shares > 0, "YR: nothing to claim");
        claimable[epoch][msg.sender] = 0;
        IERC20(vault).safeTransfer(msg.sender, shares);
        emit Claimed(msg.sender, epoch, shares);
    }

    function claimableFor(address recipient, uint256 epoch) external view returns (uint256) {
        return claimable[epoch][recipient];
    }
}
