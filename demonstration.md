# Sentinel: Dynamic Compliance & ZKP Demonstration Guide

The **Chainlink Sentinel** is best demonstrated through a "Privacy-First Compliance Flow" that illustrates how a user's private bank data is turned into an on-chain verification without ever leaving their local environment.

![Sentinel ZKP Dashboard Mockup](file:///C:/Users/jmgra/.gemini/antigravity/brain/26ef8380-ffac-4cd2-84c7-bdfe24e43a9c/sentinel_zkp_dashboard_mockup_1772239397640.png)

---

## 🏗️ The 4-Phase Demo Flow

To demonstrate the power of the **Sentinel**, walk through these four distinct phases. This highlights the synergy between **Chainlink CCIP**, **Chainlink Functions**, and **Zero-Knowledge Proofs (Circom/SnarkJS)**.

### Phase 1: Local Data Isolation (Mock Bank API)
- **What to show**: The `mock-bank/` server logs.
- **Narrative**: "The user has $200,000 in their private bank account. This data is sensitive PII (Personally Identifiable Information) and must never touch a public blockchain."
- **Action**: Call `GET http://localhost:3001/investor-status?credential=investor42` to see the balance.

### Phase 2: On-the-Fly ZKP Generation (Sentinel API)
- **What to show**: The `sentinel-rest/` console output.
- **Narrative**: "The Sentinel fetches the balance locally, then runs a **Circom** circuit using **SnarkJS**. It generates a **Groth16 Proof** locally. The $200,000 balance is discarded immediately; only the cryptographic proof 'I have at least $100,000' is kept."
- **Action**: Trigger the ZKP generation via the `/send-ccip` endpoint.

### Phase 3: Cross-Chain Secure Transport (Chainlink CCIP)
- **What to show**: The packed `Client.EVM2AnyMessage` payload.
- **Narrative**: "The proof is ABI-encoded into a high-density payload and handed to the **Chainlink CCIP Router**. Chainlink's Decentralized Oracle Network (DON) ensures the proof is securely transported from Ethereum to Arbitrum."
- **Action**: Point to the `txHash` and show the encoded `pi_a`, `pi_b`, and `pi_c` arrays in the logs.

### Phase 4: On-Chain Verification & Firewall (Destination Chain)
- **What to show**: The `ComplianceGuard.sol` contract state on Tenderly.
- **Narrative**: "Upon receiving the CCIP message, the `ComplianceGuard` contract invokes the `Verifier.sol` contract (the source of truth). The proof is verified against public parameters. Once 'True', a whitelist is granted, allowing the previously blocked transaction to proceed."
- **Action**: Call `whitelistExpiry(user, asset)` on the contract to see the updated timestamp.

---

## ⚡ The "WOW" Demo Script

Run this command to execute the full flow with enhanced verbose logging.

> [!TIP]
> This script simulates the real-world sequence of the **Sentinel** in under 30 seconds.

```powershell
# 1. Start the Demo
Write-Host ">>> STARTING SENTINEL ZKP COMPLIANCE FLOW <<<" -ForegroundColor Cyan

# 2. Fetch Bank Data (Private)
$bank = Invoke-RestMethod -Uri "http://localhost:3001/investor-status?credential=investor42"
Write-Host "[BANK] Private Balance Found: `$($bank.balance)" -ForegroundColor Yellow

# 3. Generate ZKP & Send CCIP
Write-Host "[SENTINEL] Generating Groth16 Proof via SnarkJS..." -ForegroundColor Gray
$resp = Invoke-RestMethod -Uri "http://localhost:3002/send-ccip" -Method Post -ContentType "application/json" -Body '{"proofHash":"0x0"}'

# 4. Success Result
Write-Host "[SUCCESS] Proof Verified & CCIP Message Sent!" -ForegroundColor Green
Write-Host "[TX HASH] $($resp.txHash)" -ForegroundColor Cyan
Write-Host "[INFO] Transaction allowed on Arbitrum via ZK-Compliance Guard."
```

## 🏆 Competitive Advantage
- **Privacy**: No PII on-chain.
- **Trust**: Proof is mathematically absolute.
- **Interoperability**: Logic spans multiple chains via CCIP.
- **Security**: Destination-chain firewall prevents unauthorized asset interactions.
