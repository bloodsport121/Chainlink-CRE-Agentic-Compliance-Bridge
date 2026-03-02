// SPDX-License-Identifier: MIT
// Owner: Justin Gramke (jmgramke@gmail.com)
pragma solidity 0.8.20;

contract ZKAttestation {
    struct Attestation {
        bytes proof;
        uint256 expiry;
        address user;
        address asset;
    }

    mapping(bytes32 => Attestation) public attestations;
    address public functionsConsumerAddress;

    event AttestationCreated(address indexed user, bytes32 indexed proofHash, uint256 expiry, address indexed asset);

    modifier onlyFunctionsConsumer() {
        require(msg.sender == functionsConsumerAddress, "Not authorized");
        _;
    }

    function setFunctionsConsumer(address _consumer) external {
        functionsConsumerAddress = _consumer;
    }

    function createAttestation(bytes calldata proof, uint256 expiry, address user, address asset) external onlyFunctionsConsumer {
        bytes32 proofHash = keccak256(proof);
        attestations[proofHash] = Attestation(proof, expiry, user, asset);
        emit AttestationCreated(user, proofHash, expiry, asset);
    }
}
