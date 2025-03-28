// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract Counter {
    euint32 public count;
    euint32 public ONE;

    constructor() {
        ONE = FHE.asEuint32(1);
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
}
