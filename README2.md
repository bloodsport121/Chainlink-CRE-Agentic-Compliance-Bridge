# Chainlink Sentinel Skill: Dynamic Compliance Firewall

**Target Location**: `C:\Users\jmgra\antigravityagents\.agent\workflows\chainlink-sentinel\dynamic-compliance-firewall`

## 🛡️ Overview: What is this Skill?
The `DynamicComplianceFirewall` is the specialized logic hub for **Zero-Knowledge Proof (ZKP)** compliance. While the root Sentinel folder handles general orchestration, this skill contains the "Hard Logic" required to protect institutional assets on secondary chains (Arbitrum).

## 🚀 Key Skill Components

### 1. The ZK-Attestor (Source Engine)
Located in `sentinel-rest/`, this component is responsible for the **Creation** of the proof. It:
- Connects to the **Mock Bank** to fetch private balance data.
- Uses **SnarkJS** to generate a Groth16 proof.
- Packages the proof into a **Chainlink CCIP** message.

### 2. The Verification Gate (Destination Engine)
Located in `contracts/ComplianceGuard.sol`, this is the "Lock" on the vault. 
- It implements `CCIPReceiver`.
- It performs an on-chain `verifier.verifyProof()` call.
- It only whitelists users who provide a valid, anonymous compliance proof.

### 3. The Payout Sentry (Escrow)
Located in `contracts/InstitutionalEscrow.sol`, this is the "Vault".
- It holds the 10 ETH allocated for the institutional trade.
- It is hard-coded to check the `ComplianceGuard` before releasing any funds.
- **Fail-Safe**: Even if the dispatcher is hacked, the Escrow will not open unless the Firewall has been cleared by a valid ZKP.

## 🌉 The "Virtual Bridge" Logic
Because we are working on **Tenderly Virtual Testnets**, the Chainlink nodes are simulated.
- **Problem**: CCIP messages stay in the "Outbox" on the source.
- **Solution**: The `bridge-relay.ts` script acts as our "Local Sentinel Relay." It ferries the ZKP from the source router to the destination firewall, allowing for a 1:1 simulation of production Chainlink behavior.

## 🛠️ Management Guide
| File | Role | Change this if... |
|---|---|---|
| `sentinel-rest/.env` | Network Config | You deploy to a new Tenderly Virtual Network. |
| `mock-bank/index.js` | User Data | You want to test a "Compliance Failure" (set balance < 100). |
| `scripts/bridge-relay.ts` | The Ferry | You see a "Call Exception" (usually means the destination has no gas). |

## ✅ Summary of the "Silent" Workflow
1. **Originate**: Sentinel Brain makes the ZKP.
2. **Relay**: Sentinel Relay ferries the proof.
3. **Verify**: Smart Contract confirms "✅ COMPLIANCE ATTESTED! The Agentic Compliance Bridge is now OPEN for this institution.".
4. **Settle**: Escrow releases the "Hero Shot" payout.
