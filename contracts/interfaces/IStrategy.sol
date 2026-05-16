// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IStrategy {
    function deployFunds(uint256 amount) external;
    function freeFunds(uint256 amount) external;
    function harvestAndReport() external returns (uint256 totalAssets);
    function totalAssets() external view returns (uint256);
    function asset() external view returns (address);
    function vault() external view returns (address);
    function keeper() external view returns (address);
    function management() external view returns (address);
    function emergencyAdmin() external view returns (address);
    function isActive() external view returns (bool);
}
