// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./interfaces/IAllocationMechanism.sol";

contract FixedAllocationMechanism is IAllocationMechanism {
    address[] private _recipients;
    uint256[] private _weights;
    uint256 private _totalWeight;

    address public owner;

    event RecipientsUpdated(address[] recipients, uint256[] weights);

    modifier onlyOwner() {
        require(msg.sender == owner, "FAM: not owner");
        _;
    }

    constructor(address _owner, address[] memory recipients, uint256[] memory weights) {
        owner = _owner;
        _setRecipients(recipients, weights);
    }

    function getRecipients() external view override returns (address[] memory, uint256[] memory) {
        return (_recipients, _weights);
    }

    function totalWeight() external view override returns (uint256) {
        return _totalWeight;
    }

    function epochDuration() external pure override returns (uint256) {
        return 0; // fixed, no epochs
    }

    function updateRecipients(
        address[] calldata recipients,
        uint256[] calldata weights
    ) external onlyOwner {
        _setRecipients(recipients, weights);
    }

    function _setRecipients(address[] memory recipients, uint256[] memory weights) internal {
        require(recipients.length == weights.length, "FAM: length mismatch");
        require(recipients.length > 0, "FAM: no recipients");

        uint256 sum = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            require(recipients[i] != address(0), "FAM: zero address");
            sum += weights[i];
        }
        require(sum > 0, "FAM: zero total weight");

        _recipients = recipients;
        _weights = weights;
        _totalWeight = sum;

        emit RecipientsUpdated(recipients, weights);
    }
}
