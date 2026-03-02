---
description: Bridge Skill Documentation
---

# Agentic Compliance Bridge Skill: Dynamic Compliance Firewall
# Hackathon 2026

**Target Location**: `C:\Users\jmgra\antigravityagents\.agent\workflows\chainlink-sentinel\dynamic-compliance-firewall`

## 🛡️ Overview: What is this Skill?
The `DynamicComplianceFirewall` is the specialized logic hub for **Zero-Knowledge Proof (ZKP)** compliance. While the root directory handles general orchestration, this skill contains the "Hard Logic" required to protect institutional assets.

## 🚀 Hackathon Demonstration - Dynamic Compliance Firewall

**0. Purpose**
Institutions want to use Defi, but they cant risk interacting with non compliant liquidity. Our Agentic Compliance Bridge solves this by deploying a custom-built skill called Dynamic Compliance Firewall, where Zero Knowledge Proofs and CCIP are used to create a privacy-preserving 'Compliance Firewall' that will only release a transaction from Escrow into the compliant defi environment if it is cryptographically proven to be a compliant transaction.
**1. ORIGINATE – The ZK-Attestor (Source Engine)**  
`sentinel-rest/` (Agentic Brain):  
- Connects to Mock Bank via Chainlink Functions for private balance/jurisdiction.  
- Uses SnarkJS to generate Groth16 ZKP (balance > 100 ETH AND jurisdiction = USA).  
- Packages proof into CCIP message → posts to source outbox.

**2. RELAY – The Bridge Transit**  
Bridge Relay (simulated CCIP):  
- Picks up attestation from source outbox.  
- Delivers to destination firewall contract.

**3. VERIFY – The Verification Gate (Destination Engine)**  
`contracts/ComplianceGuard.sol` (Lock on vault):  
- Implements `CCIPReceiver`.  
- On‑chain `verifier.verifyProof()`.  
- If valid: **"✅ COMPLIANCE ATTESTED"** → firewall opens (🔥 OPEN).

**4. SETTLE – The Payout Sentry (Escrow)**  
`contracts/InstitutionalEscrow.sol` (Vault):  
- Holds 10 ETH for trade.  
- Checks `ComplianceGuard` before release.  
- When firewall open, funds instantly released.  
- **Fail‑Safe**: Escrow only opens with valid ZKP, even if dispatcher hacked.

## 🌉 The "Virtual Bridge" Logic
Because we are working on **Tenderly Virtual Testnets**, the Chainlink nodes are simulated.
- **Problem**: CCIP messages stay in the "Outbox" on the source.
- **Solution**: The `bridge-relay.ts` script acts as our "Local Bridge Relay." It ferries the ZKP from the source router to the destination firewall, allowing for a 1:1 simulation of production Chainlink behavior.

## 🛠️ Management Guide
| File | Role | Change this if
| `sentinel-rest/.env` | Network Config | You deploy to a new Tenderly Virtual Network. |
| `mock-bank/index.js` | User Data | You want to test a "Compliance Failure" (set balance < 100). |
| `scripts/bridge-relay.ts` | The Ferry | You see a "Call Exception" (usually means the destination has no gas).

# Owner: Justin Gramke (jmgramke@gmail.com)