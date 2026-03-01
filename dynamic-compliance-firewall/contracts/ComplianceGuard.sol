// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

interface IVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory input) external view returns (bool);
}

contract ComplianceGuard is CCIPReceiver {
    address public verifierAddress;
    mapping(address => mapping(address => uint256)) public whitelistExpiry;

    event WhitelistGranted(address indexed user, address indexed asset, uint256 expiry);

    constructor(address router, address _verifierAddress) CCIPReceiver(router) {
        verifierAddress = _verifierAddress;
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        (uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory publicInputs) = abi.decode(any2EvmMessage.data, (uint[2], uint[2][2], uint[2], uint[3]));
        _validateAndWhitelist(a, b, c, publicInputs);
    }

    // Temporary method to demonstrate logic across separate DevNets
    function manualVerify(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory publicInputs) external {
        _validateAndWhitelist(a, b, c, publicInputs);
    }

    function _validateAndWhitelist(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[3] memory publicInputs) internal {
        bool isValid = IVerifier(verifierAddress).verifyProof(a, b, c, publicInputs);
        require(isValid, "ZK Proof is invalid!");
        
        whitelistExpiry[address(0)][address(0)] = block.timestamp + 86400;
        emit WhitelistGranted(address(0), address(0), block.timestamp + 86400);
    }
}
