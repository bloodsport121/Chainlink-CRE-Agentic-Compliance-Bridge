---
description: 
---


Chainlink Sentinel: The Agentic Compliance Bridge 
Hackathon: Chainlink Convergence (Feb 2026)
Status: Live Demo Ready | Core Innovation: Dynamic Compliance Firewall powered by Chainlink CRE

🧭 Overview
The Agentic Compliance Bridge is a privacy-preserving, cross-chain compliance bridge that enables institutions to safely enter DeFi. It solves the core problem: Institutions want to use DeFi, but they cannot risk interacting with non-compliant liquidity.

Our solution: an Agentic Compliance Bridge that acts as a cryptographic gateway. It verifies private banking data (balance, jurisdiction) using Zero-Knowledge Proofs (ZKPs), and only releases funds from a secure escrow vault after compliance is proven. The bridge never exposes Personally Identifiable Information (PII) on-chain.

The centerpiece of our hackathon submission is the Dynamic Compliance Firewall—a smart gateway that remains locked until a valid cross-chain compliance attestation arrives. This firewall is controlled by a Customized Runtime Environment (CRE) Agent that performs the heavy off-chain logic: ZKP generation, bank API audits, and cross-chain orchestration via Chainlink services.

🚀 How It Works (High-Level)
A user sends funds to the Agentic Compliance Bridge. Funds are immediately placed in an Institutional Escrow Vault.

The CRE Agent (off-chain) connects to the user’s traditional bank via REST API to fetch private credentials (balance, jurisdiction).

The agent generates a Zero-Knowledge Proof that the user meets compliance rules (e.g., balance > 100 ETH AND jurisdiction = USA) without revealing the raw data.

The proof is ferried cross-chain using Chainlink CCIP to the destination chain (e.g., Arbitrum) where the DeFi environment lives.

The Dynamic Compliance Firewall on the destination chain verifies the ZKP. If valid, it opens the gate.

The agent triggers atomic settlement: funds are released from escrow to the user’s wallet on the destination chain.

Traditional bridges move money, which is slow and vulnerable. Our Agentic Bridge moves compliance proofs, enabling instant settlement of assets already secured on the destination chain.

🔗 Key Chainlink Services Used
Service	Role in Sentinel
Chainlink Functions (CRE-Powered)	The primary CRE product: reaches into the mock bank’s REST API, fetches private data, and triggers ZKP generation. It’s the “auditor” that brings real-world data on-chain.
Chainlink CCIP	The secure transport layer that carries the compliance attestation (ZKP hash) from the source chain to the destination firewall.
Chainlink Data Feeds	Provides real-time pricing (e.g., ETH/USD) to evaluate threshold rules like “balance > 100 ETH” in fiat-equivalent terms.
Chainlink Proof of Reserve (PoR)	Ensures the escrow vault is always 1:1 backed by institutional funds, adding a transparency layer for regulators.
Chainlink VRF	Can be used for randomized spot‑check audits, adding an extra layer of regulatory oversight for institutional participants.
All these services are orchestrated by our CRE Agent, which runs in Chainlink’s Customized Runtime Environment—the off‑chain compute layer that handles private logic and expensive computations.

🏛️ Architecture: The Agentic CRE Core
The Sentinel is not a simple bot; it is a Customized Runtime Environment Agent. It operates off‑chain, performing the “hard logic” (ZKP generation, bank API calls) that is too private or expensive for the blockchain.

```plaintext
[User] --(1) send funds--> [Institutional Escrow (Source Chain)]
                                      |
                                      | (2) locked
                                      v
                            [CRE Agent (off-chain)]
                                      |
        +-----------------------------+-----------------------------+
        |                             |                             |
        | (3) Functions                | (4) Circom/SnarkJS          | (5) CCIP
        v                             v                             v
[Mock Bank API]              [ZKP Generation]               [CCIP Outbox]
 (balance, jurisdiction)       (compliance proof)             (proof hash)
        |                             |                             |
        +-------------(6) data flow----+                             |
                                      | (7) proof hash               |
                                      +-------------> [CCIP] ------->+
                                                                      |
                                                                      v
                                                        [Dynamic Compliance Firewall (Dest Chain)]
                                                                      |
                                                                      | (8) verifyProof()
                                                                      v
                                                           [Solinity Verifier Contract]
                                                                      |
                                                                      | (9) if valid -> OPEN
                                                                      v
                                                           [Firewall Gate: 🔥 OPEN]
                                                                      |
                                                                      | (10) releaseFunds()
                                                                      v
                                                           [Recipient Wallet on Dest Chain]
```



The CRE Agent (implemented in sentinel-rest/) is the brain. It uses Chainlink Functions to fetch bank data, generates the ZKP locally, and initiates the CCIP message. This architecture ensures that private data never leaves the agent’s secure off‑chain environment.

🎯 Hackathon Centerpiece: The Dynamic Compliance Firewall
This skill is the heart of our submission. It’s a smart gateway that remains 🔒 LOCKED until it receives a valid, cross‑chain compliance attestation.

Core Capabilities
Privacy‑First Verification: Uses Chainlink Functions (CRE) to reach into the real world, verify bank balances and jurisdictions, and convert that data into a cryptographic proof—all without exposing PII.

Dual‑Logic ZKPs: Encrypts complex rules (e.g., Balance > 100 ETH AND Jurisdiction = USA) into a single Groth16 proof. The proof is generated off‑chain and verified on‑chain by a Solidity verifier.

Cross‑Chain Synchronization: Employs Chainlink CCIP to ferry the proof hash between the source compliance check and the destination firewall.

Institutional Escrow Vault: A high‑security vault controlled exclusively by the Agentic Compliance Bridge. Funds are released only after the ZKP proves compliance, enabling atomic settlement.

The firewall contract (ComplianceGuard.sol) exposes a verifyProof function that consumes the ZKP and, if valid, toggles the gate to 🔥 OPEN. Once open, the agent can call releaseFunds to settle the transaction.

🤖 Agentic CRE Workflows
The Sentinel manages the bridge lifecycle through four distinct workflows, triggered by human‑to‑agent slash commands (demonstrated in our live demo):

Workflow	Command	Logic Description
Origination	/send-ccip	Agent uses Functions to audit bank data and generate the ZKP locally.
Transmission	/relay	Agent ferries the cryptographic proof across the CCIP bridge (simulated via a relay script).
Verification	/status	Agent scans the destination chain to confirm the firewall is 🔥 OPEN.
Settlement	/release-funds	Agent triggers the escrow release, completing atomic settlement.

These workflows are powered by the CRE, which allows the agent to run continuously, react to events, and interact with both off‑chain APIs and on‑chain contracts. We use NPM commands in the Hackathon submission but we have also turned those NPM commands into /commands for our Agentic Compliance Bridge to use when needed.

📁 Project Structure
text
chainlink-sentinel/
├── dynamic-compliance-firewall/      # 💎 MAIN HACKATHON FEATURE
│   ├── sentinel-rest/                # 🧠 CRE Agent (Node.js + Express)
│   │   ├── api/                       # Bank API simulator & ZKP trigger
│   │   ├── zk-utils/                   # SnarkJS proof generation
│   │   └── ccip-simulator/              # Relay script for CCIP messages
│   ├── circuits/                      # 🛡️ ZK-Proof Logic (Circom)
│   │   ├── compliance.circom
│   │   └── compile.sh
│   ├── contracts/                     # 🔒 The Firewall & Escrow (Solidity)
│   │   ├── ComplianceGuard.sol
│   │   ├── InstitutionalEscrow.sol
│   │   └── verifier.sol (auto‑generated)
│   └── scripts/                       # 📞 Deployment & interaction scripts
├── ai-copilot.js                      # AI Compliance analysis (future)
├── sanctions-oracle.js                # Multi‑provider sanctions screening
└── stealth-pass.js                    # DECO ZKP attestation engine (prototype)
🏗️ Technical Stack
ZKP Engine: Circom 2.0 & SnarkJS (Groth16)

Orchestration: Chainlink CRE (Customized Runtime Environment) via Node.js agent

Data Fetching: Chainlink Functions (simulated REST calls)

Transport: Chainlink CCIP (simulated via relay script)

Blockchain: Solidity, Ethers.js, Hardhat

Testing Environment: Tenderly Virtual Testnets (Ethereum & Arbitrum forks)

Frontend (Demo): Simple HTML/JS dashboards for bank and operator

🔮 Why Chainlink CRE?
The Customized Runtime Environment is the perfect fit for our agentic bridge because:

It allows off‑chain compute for private data processing (bank API calls) and heavy cryptographic work (ZKP generation) that would be impossible or too costly on‑chain.

Chainlink Functions (the primary CRE product) gives our agent a direct, secure channel to fetch real‑world data and bring it on‑chain.

The CRE agent can run continuously, listening for events and executing complex workflows—exactly what we need for a compliance bridge that must react to user transactions and maintain state.

Our Agentic Compliance Bridge is a living example of what CRE enables: a hybrid smart contract that combines the transparency of blockchain with the privacy and computational power of off‑chain agents.

📜 License
MIT — Dedicated to the Chainlink Convergence 2026 Hackathon.