// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract Counter {
    euint32 public count;
    euint32 public ONE;
    ebool public isInitialized;

    constructor() {
        ONE = FHE.asEuint32(1);
        count = FHE.asEuint32(0);

        isInitialized = FHE.asEbool(false);
        isInitialized = FHE.asEbool(true);

        FHE.allowThis(count);
        FHE.allowThis(ONE);

        FHE.allowSender(count);
    }

    function increment() public {
        count = FHE.add(count, ONE);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function decrement() public {
        count = FHE.sub(count, ONE);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function reset(InEuint32 memory value) public {
        count = FHE.asEuint32(value);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function allowCounterPublicly() public {
        FHE.allowPublic(count);
    }

    function revealCounter(uint32 plaintext, bytes memory signature) public {
        FHE.publishDecryptResult(count, plaintext, signature);
    }

    function getDecryptedValue() external view returns (uint256) {
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(count);
        if (!decrypted) revert("Value is not ready");

        return value;
    }
}
