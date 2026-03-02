// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  🔐 AgenticComplianceBridge — On-Chain ZKP Compliance Layer
 * ═══════════════════════════════════════════════════════════════════
 * 
 *  This contract sits on the DESTINATION chain and acts as a 
 *  privacy-preserving compliance gate for inbound CCIP transfers.
 *
 *  It verifies DECO ZK attestation hashes without ever seeing PII.
 *  Only transfers with valid, non-expired Stealth-Pass attestations
 *  are allowed through.
 *
 *  Chainlink Products Used:
 *    - CCIP (cross-chain message receiver)
 *    - DECO (attestation generation, off-chain)
 *
 *  @author Justin Gramke (jmgramke@gmail.com)
 */

contract StealthPassVerifier {

    // ─── STATE ────────────────────────────────────────────────────

    address public owner;
    address public sentinel;  // The Bridge agent's authorized address

    // Attestation registry: hash → attestation metadata
    struct Attestation {
        bytes32 entityHash;        // Hashed entity ID (no PII)
        uint256 issuedAt;          // Timestamp of issuance
        uint256 validUntil;        // Expiration timestamp
        uint8   claimCount;        // Number of claims verified
        bool    allClaimsPassed;   // Whether all claims passed
        bool    exists;            // Registry flag
    }

    mapping(bytes32 => Attestation) public attestations;

    // Transfer authorization: attestation hash → authorized
    mapping(bytes32 => bool) public authorizedTransfers;

    // Compliance statistics
    uint256 public totalVerified;
    uint256 public totalRejected;
    uint256 public totalAttestationsRegistered;

    // ─── EVENTS ───────────────────────────────────────────────────

    event AttestationRegistered(
        bytes32 indexed attestationHash,
        bytes32 entityHash,
        uint256 validUntil,
        uint8 claimCount
    );

    event TransferAuthorized(
        bytes32 indexed attestationHash,
        address indexed receiver,
        uint256 amount
    );

    event TransferRejected(
        bytes32 indexed attestationHash,
        string reason
    );

    event AttestationRevoked(
        bytes32 indexed attestationHash,
        string reason
    );

    // ─── MODIFIERS ────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "StealthPass: not owner");
        _;
    }

    modifier onlySentinel() {
        require(
            msg.sender == sentinel || msg.sender == owner,
            "StealthPass: not authorized sentinel"
        );
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────

    constructor(address _sentinel) {
        owner = msg.sender;
        sentinel = _sentinel;
    }

    // ─── CORE FUNCTIONS ───────────────────────────────────────────

    /**
     * @notice Register a new DECO attestation on-chain.
     *         Called by the Bridge after off-chain DECO verification.
     * 
     * @param _attestationHash The master hash from the DECO attestation
     * @param _entityHash      Hashed entity identifier (no raw PII)
     * @param _validUntil      Unix timestamp of attestation expiry
     * @param _claimCount      Number of compliance claims verified
     * @param _allPassed       Whether every claim was verified true
     */
    function registerAttestation(
        bytes32 _attestationHash,
        bytes32 _entityHash,
        uint256 _validUntil,
        uint8   _claimCount,
        bool    _allPassed
    ) external onlySentinel {
        require(!attestations[_attestationHash].exists, "StealthPass: attestation already registered");
        require(_validUntil > block.timestamp, "StealthPass: attestation already expired");
        require(_claimCount > 0, "StealthPass: must have at least one claim");

        attestations[_attestationHash] = Attestation({
            entityHash: _entityHash,
            issuedAt: block.timestamp,
            validUntil: _validUntil,
            claimCount: _claimCount,
            allClaimsPassed: _allPassed,
            exists: true
        });

        totalAttestationsRegistered++;

        emit AttestationRegistered(_attestationHash, _entityHash, _validUntil, _claimCount);
    }

    /**
     * @notice Verify an attestation and authorize a cross-chain transfer.
     *         This is the "privacy firewall" gate.
     *
     * @param _attestationHash The DECO attestation hash
     * @param _receiver        The intended recipient on this chain
     * @param _amount          The transfer amount (for logging only)
     * @return authorized      Whether the transfer is approved
     */
    function verifyAndAuthorize(
        bytes32 _attestationHash,
        address _receiver,
        uint256 _amount
    ) external onlySentinel returns (bool authorized) {
        Attestation storage att = attestations[_attestationHash];

        // Check 1: Attestation exists
        if (!att.exists) {
            totalRejected++;
            emit TransferRejected(_attestationHash, "ATTESTATION_NOT_FOUND");
            return false;
        }

        // Check 2: Not expired
        if (block.timestamp > att.validUntil) {
            totalRejected++;
            emit TransferRejected(_attestationHash, "ATTESTATION_EXPIRED");
            return false;
        }

        // Check 3: All claims passed
        if (!att.allClaimsPassed) {
            totalRejected++;
            emit TransferRejected(_attestationHash, "CLAIMS_NOT_ALL_PASSED");
            return false;
        }

        // All checks passed → authorize
        authorizedTransfers[_attestationHash] = true;
        totalVerified++;

        emit TransferAuthorized(_attestationHash, _receiver, _amount);
        return true;
    }

    /**
     * @notice Revoke an attestation (e.g. if entity becomes non-compliant)
     * @param _attestationHash The attestation to revoke
     * @param _reason          Human-readable reason for audit log
     */
    function revokeAttestation(
        bytes32 _attestationHash,
        string calldata _reason
    ) external onlySentinel {
        require(attestations[_attestationHash].exists, "StealthPass: attestation not found");

        attestations[_attestationHash].allClaimsPassed = false;
        authorizedTransfers[_attestationHash] = false;

        emit AttestationRevoked(_attestationHash, _reason);
    }

    /**
     * @notice Check if a transfer is authorized (view function for CCIP receiver)
     */
    function isTransferAuthorized(bytes32 _attestationHash) external view returns (bool) {
        Attestation storage att = attestations[_attestationHash];
        return att.exists && att.allClaimsPassed && block.timestamp <= att.validUntil;
    }

    /**
     * @notice Get compliance statistics (for regulatory reporting)
     */
    function getComplianceStats() external view returns (
        uint256 _totalVerified,
        uint256 _totalRejected,
        uint256 _totalRegistered,
        uint256 _approvalRate
    ) {
        uint256 total = totalVerified + totalRejected;
        uint256 rate = total > 0 ? (totalVerified * 10000) / total : 0; // basis points
        return (totalVerified, totalRejected, totalAttestationsRegistered, rate);
    }

    // ─── ADMIN ────────────────────────────────────────────────────

    function updateSentinel(address _newSentinel) external onlyOwner {
        sentinel = _newSentinel;
    }
}
