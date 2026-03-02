---
description: 
---

# 🛡️ Agentic Compliance Bridge
**Owner: Justin Gramke (jmgramke@gmail.com)**
**Hackathon:** Chainlink Convergence (Feb 2026)  
**Main Skill & Demo** - Dynamic Compliance Firewall powered by Chainlink CRE

🧭 **Overview**
The Agentic Compliance Bridge is a privacy-preserving, cross-chain compliance bridge that enables institutions to safely enter DeFi. It solves the core problem: Institutions want to use DeFi, but they cannot risk interacting with non-compliant liquidity.

Our solution: an Agentic Compliance Bridge that acts as a cryptographic gateway. It verifies private banking data (balance, jurisdiction) using Zero-Knowledge Proofs (ZKPs), and only releases funds from a secure escrow vault after compliance is proven. The bridge never exposes Personally Identifiable Information (PII) on-chain.

The centerpiece of our hackathon submission is the Dynamic Compliance Firewall—a smart gateway that remains locked until a valid cross-chain compliance attestation arrives. This firewall is controlled by a Customized Runtime Environment (CRE) Agent that performs the heavy off-chain logic: ZKP generation, bank API audits, and cross-chain orchestration via Chainlink services.

🚀 **How It Works (High-Level)**
A user sends funds to the Agentic Compliance Bridge. Funds are immediately placed in an Institutional Escrow Vault.

The CRE Agent (off-chain) connects to the user’s traditional bank via REST API to fetch private credentials (balance, jurisdiction).

The agent generates a Zero-Knowledge Proof that the user meets compliance rules (e.g., balance > 100 ETH AND jurisdiction = USA) without revealing the raw data.

The proof is ferried cross-chain using Chainlink CCIP to the destination chain (e.g., Arbitrum) where the DeFi environment lives.

The Dynamic Compliance Firewall on the destination chain verifies the ZKP. If valid, it opens the gate.

The Agentic Bridge triggers atomic settlement: funds are released from escrow to the user’s wallet on the destination chain.

Traditional bridges move money, which is slow and vulnerable. Our Agentic Bridge moves compliance proofs, enabling instant settlement of assets already secured on the destination chain.

🔗 **Demonstrated Capabilities**

| CRE Workflows |
|---------|------------------|
| Scene Initialization: Reset wallet and secure vault funds. |
| Institutional Audit: Fetch bank data via Chainlink Functions. |
| ZKP Origination: Generate anonymous Groth16 Snark Proof.|
| Cross-Chain Transmission: Ferry ZK-Proof Hash via CCIP.|
| Firewall Monitoring: Scan destination firewall for OPEN.|
| Atomic Settlement: Trigger verified institutional fund release.|
| Sanctions Screening: Perform real-time OFAC/AML wallet audits.|
 
| Agentic Compliance Bridge |
|---------|------------------|
| Blocks unauthorized cross-chain asset transfers.|
| Validates ZK-Proofs natively on Arbitrum.|
| Receives compliance data via CCIP.|
| Locks funds until proof verified.|
| Exposes zero PII to blockchain.|
| Executes private audits off-chain.|
| Connects directly to bank APIs.|
| Generates anonymous ZK-Proofs locally.|
| Ferries cryptographic proofs across chains.|
| Uses oracle data for valuations.|
| Automates entire bridge settlement lifecycle.|


All these services are orchestrated by our CRE Agentic Bridge, which runs in Chainlink’s Customized Runtime Environment—the off‑chain compute layer that handles private logic and expensive computations.

🏛️ **Architecture: The Agentic CRE Core**
The Agentic Compliance Bridge is a Customized Runtime Environment Agent. It operates off‑chain, performing the “hard logic” (ZKP generation, bank API calls) that is too private or expensive for the blockchain.

```plaintext

┌────────┐
│  USER  │
└───┬────┘
    │ (1) SEND FUNDS
    ▼
┌──────────────────────────────┐          Status:   ┌───────────────────────────────────────┐
│ Institutional Escrow         │ ───(2) LCKD────────┤ Agentic Compliance Bridge (Off-chain) │
│ (Source Chain)               │                    └─────────┬─────────────────────────────┘
└──────────────────────────────┘                              │
                                                              │
      Orchestrates Off-chain via Parallel Tracks:             │
      ┌───────────────────────────────────────────────────────┤
      │ Functions (3)               Circom/SnarkJS (4)        │ CCIP (5)
      ▼                             ▼                         ▼
┌─────────────┐               ┌─────────────┐           ┌─────────────┐
│  Mock Bank  │◄──────(6)─────► ZKP         │───(6)────►│ CCIP Outbox │
│     API     │    Data Flow  │ Generation  │ Data Flow │ (Proof Hash)│
│(bal, juris) │               │(comp. proof)│           └──────┬──────┘
└─────────────┘               └──────┬──────┘                  │
                                     │ (7) PROOF               │
                                     │     HASH                │
                                     ▼                         │
                              ┌─────────────┐                  │
                              │    CCIP     │◄─────────────────┘
                              └──────┬──────┘
                                     │
========================CROSS-CHAIN TRANSFER===================================
                                     │
                                     ▼
                      ┌──────────────┴─────────────┐
                      │ Dynamic Compliance Firewall│
                      │ (Dest Chain)               │
                      └────────┬────────────┬──────┘
                               │            │
             (8) verifyProof() │            │
                               ▼            │
                      ┌────────┴──────┐     │
                      │   Solidity    │     │ (9) if valid ->
                      │Verifier Contr.│     │     OPEN
                      └────────┬──────┘     │
                               └───────────►▼
                                    ┌───────┴───────┐
                                    │ Firewall Gate │
                                    │    🔥 OPEN    │
                                    └───────┬───────┘
                                            │ (10) releaseFunds()
                                            ▼
                                    ┌───────┴──────┐
                                    │ Recipient    │
                                    │ Wallet (Dest)│
                                    └──────────────┘

```



The Agentic Compliance Bridge (implemented in sentinel-rest/) is the Ai Agent brain. It uses Chainlink Functions to fetch bank data, generates the ZKP locally, and initiates the CCIP message. This architecture ensures that private data never leaves the agent’s secure off‑chain environment.

🎯 **Hackathon Centerpiece: The Dynamic Compliance Firewall**
This skill is the heart of our submission. It’s a smart gateway that remains 🔒 LOCKED until it receives a valid, cross‑chain compliance attestation.

Core Capabilities
Privacy‑First Verification: Uses Chainlink Functions (CRE) to reach into the real world, verify bank balances and jurisdictions, and convert that data into a cryptographic proof—all without exposing PII.

Dual‑Logic ZKPs: Encrypts complex rules (e.g., Balance > 100 ETH AND Jurisdiction = USA) into a single Groth16 proof. The proof is generated off‑chain and verified on‑chain by a Solidity verifier.

Cross‑Chain Synchronization: Employs Chainlink CCIP to ferry the proof hash between the source compliance check and the destination firewall.

Institutional Escrow Vault: A high‑security vault controlled exclusively by the Agentic Compliance Bridge. Funds are released only after the ZKP proves compliance, enabling atomic settlement.

The firewall contract (ComplianceGuard.sol) exposes a verifyProof function that consumes the ZKP and, if valid, toggles the gate to 🔥 OPEN. Once open, the agent can call releaseFunds to settle the transaction.

🤖 **Agentic CRE Workflows**
The Agentic Compliance Bridge manages the deposit clearing process through four distinct workflows, triggered by human‑to‑agent slash commands (demonstrated with NPM Terminal Commands in our live demo):

Workflow	Command	Logic Description
Origination	/send-ccip	Agent uses Functions to audit bank data and generate the ZKP locally.
Transmission	/relay	Agent ferries the cryptographic proof across the CCIP bridge (simulated via a relay script).
Verification	/status	Agent scans the destination chain to confirm the firewall is 🔥 OPEN.
Settlement	/release-funds	Agent triggers the escrow release, completing atomic settlement.

These workflows are powered by the CRE, which allows the agent to run continuously, react to events, and interact with both off‑chain APIs and on‑chain contracts. We use NPM commands in the Hackathon submission but we have also turned those NPM commands into /commands for our Agentic Compliance Bridge to use when needed.

```plaintext
agentic-compliance-bridge/
├── dynamic-compliance-firewall/      # 💎 MAIN HACKATHON FEATURE
│   ├── sentinel-rest/                # 🧠 Agentic Bridge Agent (Node.js + Express)
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
```



🏗️ **Technical Stack**
ZKP Engine: Circom 2.0 & SnarkJS (Groth16)

Orchestration: Chainlink CRE (Customized Runtime Environment) via Node.js agent

Data Fetching: Chainlink Functions (simulated REST calls)

Transport: Chainlink CCIP (simulated via relay script)

Blockchain: Solidity, Ethers.js, Hardhat

Testing Environment: Tenderly Virtual Testnets (Ethereum & Arbitrum forks)

Frontend (Demo): Simple HTML/JS dashboards for bank and operator


🔮 **Why Chainlink CRE?**
The Customized Runtime Environment is the perfect fit for our agentic bridge because:

It allows off‑chain compute for private data processing (bank API calls) and heavy cryptographic work (ZKP generation) that would be impossible or too costly on‑chain.

Chainlink Functions (the primary CRE product) gives our agent a direct, secure channel to fetch real‑world data and bring it on‑chain.

The CRE agent can run continuously, listening for events and executing complex workflows—exactly what we need for a compliance bridge that must react to user transactions and maintain state.

Our Agentic Compliance Bridge is a living example of what CRE enables: a hybrid smart contract that combines the transparency of blockchain with the privacy and computational power of off‑chain agents.


📜 License
MIT — Dedicated to the Chainlink Convergence 2026 Hackathon