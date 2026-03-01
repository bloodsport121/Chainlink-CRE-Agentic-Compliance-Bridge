# Implementation Plan: Sentinel Stealth-Pass (Dynamic Compliance Firewall)

## Goal Summary
Implement the "Sentinel Stealth-Pass" cross-chain privacy-preserving compliance bridge using Chainlink CCIP, ZKP-Lite (simulated), and Chainlink Functions. The architecture relies on an orchestrator (Sentinel API / n8n) handling cross-chain messaging dynamically.

## Proposed Changes

### Project Initialization
- **[NEW]** `dynamic-compliance-firewall/`: Initialize a Hardhat TS environment.
- **[NEW]** `dynamic-compliance-firewall/hardhat.config.ts`: Configure multiple networks (Tenderly source and destination).

### Smart Contracts (Solidity v0.8.x)
- **[NEW]** `dynamic-compliance-firewall/contracts/ZKAttestation.sol`: Stores user's compliance attestation.
- **[NEW]** `dynamic-compliance-firewall/contracts/FunctionsConsumer.sol`: Requests bank compliance via Chainlink Functions.
- **[NEW]** `dynamic-compliance-firewall/contracts/ComplianceGuard.sol`: Receives CCIP messages on the destination chain and grants access.

### Chainlink Functions
- **[NEW]** `dynamic-compliance-firewall/functions/investor-status-fetch.js`: Executes HTTP request to mock bank and generates an ECDSA signature representing the ZKP.

### Mock Bank API
- **[NEW]** `dynamic-compliance-firewall/mock-bank/index.js`: Simple Express server simulating a real-world compliance query.

### Sentinel REST API
- **[NEW]** `dynamic-compliance-firewall/sentinel-rest/index.js`: Express wrapper that starts the chainlink flow, retrieves proofs, and forwards CCIP messages.

### n8n Workflows & Scripts
- **[NEW]** `dynamic-compliance-firewall/workflows/trigger.json` & `alert-handler.json`
- **[NEW]** `dynamic-compliance-firewall/scripts/test.sh`

## Verification Plan
### Automated & Local Verification
1. Will launch internal hardhat test nodes or local mock environments to unit-test contract compilation.
2. The final test will use the `test.sh` script to simulate the end-to-end flow from Sentinel API to CCIP receive verification.
