// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {CCIPLocalSimulator} from "@chainlink/local/src/ccip/CCIPLocalSimulator.sol";

// This contract exists solely to force Hardhat to compile the simulators
contract CompileSimulators {
    constructor() {}
}
