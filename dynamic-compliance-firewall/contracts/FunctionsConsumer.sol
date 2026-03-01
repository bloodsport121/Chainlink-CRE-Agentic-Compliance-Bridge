// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

interface IZKAttestation {
    function createAttestation(bytes calldata proof, uint256 expiry, address user, address asset) external;
}

contract FunctionsConsumer is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    address public zkAttestationAddress;
    bytes32 public donId; 
    string public sourceCode;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;

    constructor(address router, address _zkAttestation) FunctionsClient(router) {
        zkAttestationAddress = _zkAttestation;
    }

    function setConfig(string calldata _source, bytes32 _donId, uint64 _subId) external {
        sourceCode = _source;
        donId = _donId;
        subscriptionId = _subId;
    }

    function requestInvestorStatus(string calldata credential, address userAddress, address asset) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(sourceCode);
        
        string[] memory args = new string[](3);
        args[0] = credential;
        args[1] = toHexString(userAddress);
        args[2] = toHexString(asset);
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
    }

    function fulfillRequest(bytes32 /* requestId */, bytes memory response, bytes memory /* err */) internal override {
        if (response.length > 0) {
            (uint256 expiry, bytes memory proof, address user, address asset) = abi.decode(response, (uint256, bytes, address, address));
            IZKAttestation(zkAttestationAddress).createAttestation(proof, expiry, user, asset);
        }
    }

    // Helper for address to hex string conversion in memory
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(addr)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            buffer[2*i] = char(hi);
            buffer[2*i+1] = char(lo);
        }
        return string(abi.encodePacked("0x", string(buffer)));
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
