// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IAllocationMechanism {
    function getRecipients() external view returns (address[] memory recipients, uint256[] memory weights);
    function totalWeight() external view returns (uint256);
    function epochDuration() external view returns (uint256);
}
