// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAllocationMechanism.sol";

contract VotingAllocationMechanism is IAllocationMechanism {
    address public immutable vault;     // ERC-4626 vault (balance = voting power)
    uint256 public immutable _epochDuration;

    struct Candidate {
        address addr;
        uint256 votes;    // quadratic votes accumulated
    }

    uint256 public epochStart;
    uint256 public currentEpoch;

    mapping(uint256 => Candidate[]) private _epochCandidates;
    // epoch → voter → candidate → voted
    mapping(uint256 => mapping(address => mapping(address => bool))) public hasVoted;

    // Finalized epoch results
    mapping(uint256 => address[]) private _finalRecipients;
    mapping(uint256 => uint256[]) private _finalWeights;
    mapping(uint256 => uint256) private _finalTotalWeight;
    mapping(uint256 => bool) public epochFinalized;

    address[] private _activeCandidates;

    address public keeper;
    address public owner;

    event VoteCast(address indexed voter, address indexed candidate, uint256 votes);
    event EpochFinalized(uint256 indexed epoch, address[] recipients, uint256[] weights);
    event CandidateAdded(address indexed candidate);

    modifier onlyKeeper() {
        require(msg.sender == keeper, "VAM: not keeper");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VAM: not owner");
        _;
    }

    constructor(
        address _vault,
        address _keeper,
        address _owner,
        uint256 epochDurationSeconds,
        address[] memory initialCandidates
    ) {
        vault = _vault;
        keeper = _keeper;
        owner = _owner;
        _epochDuration = epochDurationSeconds;
        epochStart = block.timestamp;

        for (uint256 i = 0; i < initialCandidates.length; i++) {
            _activeCandidates.push(initialCandidates[i]);
            emit CandidateAdded(initialCandidates[i]);
        }
    }

    function addCandidate(address candidate) external onlyOwner {
        _activeCandidates.push(candidate);
        emit CandidateAdded(candidate);
    }

    function vote(address[] calldata candidates) external {
        require(block.timestamp < epochStart + _epochDuration, "VAM: epoch ended");

        uint256 balance = IERC20(vault).balanceOf(msg.sender);
        require(balance > 0, "VAM: no balance");

        // Quadratic voting: votes = sqrt(balance)
        uint256 votingPower = _sqrt(balance);
        require(candidates.length > 0, "VAM: no candidates");

        uint256 votesPerCandidate = votingPower / candidates.length;

        for (uint256 i = 0; i < candidates.length; i++) {
            require(!hasVoted[currentEpoch][msg.sender][candidates[i]], "VAM: already voted");
            hasVoted[currentEpoch][msg.sender][candidates[i]] = true;

            // Find candidate in current epoch list or add them
            bool found = false;
            for (uint256 j = 0; j < _epochCandidates[currentEpoch].length; j++) {
                if (_epochCandidates[currentEpoch][j].addr == candidates[i]) {
                    _epochCandidates[currentEpoch][j].votes += votesPerCandidate;
                    found = true;
                    break;
                }
            }
            if (!found) {
                _epochCandidates[currentEpoch].push(Candidate(candidates[i], votesPerCandidate));
            }

            emit VoteCast(msg.sender, candidates[i], votesPerCandidate);
        }
    }

    function finalizeEpoch() external onlyKeeper {
        require(block.timestamp >= epochStart + _epochDuration, "VAM: epoch not ended");
        require(!epochFinalized[currentEpoch], "VAM: already finalized");

        Candidate[] storage candidates = _epochCandidates[currentEpoch];
        uint256 n = candidates.length;

        address[] memory recipients = new address[](n);
        uint256[] memory weights = new uint256[](n);
        uint256 totalVotes = 0;

        for (uint256 i = 0; i < n; i++) {
            recipients[i] = candidates[i].addr;
            weights[i] = candidates[i].votes;
            totalVotes += candidates[i].votes;
        }

        _finalRecipients[currentEpoch] = recipients;
        _finalWeights[currentEpoch] = weights;
        _finalTotalWeight[currentEpoch] = totalVotes;
        epochFinalized[currentEpoch] = true;

        emit EpochFinalized(currentEpoch, recipients, weights);

        currentEpoch++;
        epochStart = block.timestamp;
    }

    // Returns current active results (last finalized epoch)
    function getRecipients() external view override returns (address[] memory, uint256[] memory) {
        if (currentEpoch == 0 || !epochFinalized[currentEpoch - 1]) {
            return (new address[](0), new uint256[](0));
        }
        uint256 ep = currentEpoch - 1;
        return (_finalRecipients[ep], _finalWeights[ep]);
    }

    function totalWeight() external view override returns (uint256) {
        if (currentEpoch == 0 || !epochFinalized[currentEpoch - 1]) return 0;
        return _finalTotalWeight[currentEpoch - 1];
    }

    function epochDuration() external view override returns (uint256) {
        return _epochDuration;
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function getActiveCandidates() external view returns (address[] memory) {
        return _activeCandidates;
    }
}
