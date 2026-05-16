// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./FixedAllocationMechanism.sol";
import "./VotingAllocationMechanism.sol";

contract AllocationMechanismFactory {
    enum MechanismType { FIXED, VOTING }

    event MechanismDeployed(address indexed mechanism, MechanismType mechanismType);

    function createFixed(
        address owner,
        address[] calldata recipients,
        uint256[] calldata weights
    ) external returns (address) {
        FixedAllocationMechanism m = new FixedAllocationMechanism(owner, recipients, weights);
        emit MechanismDeployed(address(m), MechanismType.FIXED);
        return address(m);
    }

    function createVoting(
        address vault,
        address keeper,
        address owner,
        uint256 epochDuration,
        address[] calldata initialCandidates
    ) external returns (address) {
        VotingAllocationMechanism m = new VotingAllocationMechanism(
            vault,
            keeper,
            owner,
            epochDuration,
            initialCandidates
        );
        emit MechanismDeployed(address(m), MechanismType.VOTING);
        return address(m);
    }
}
