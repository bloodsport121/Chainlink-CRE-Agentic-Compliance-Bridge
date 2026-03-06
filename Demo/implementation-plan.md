# 🚀 Sentinel Stealth-Pass: Demo Implementation Plan (CALIBRATED)

**Status: 10% Complete | Orchestrator: Antigravity [Gemini 3.0] | Worker Agent: Sentinel-Setup [Environment Manager]**

---

## 📋 Demo Sequence (Rollout Ready)

### Phase 1: Infrastructure Setup
- [ ] **Step 0**: Start Mock TradFi Bank Server (Port 3004) - **READY**
- [ ] **Step 0.1**: Start Sentinel REST Gateway (Port 3007) - **READY**
- [ ] **Step 1**: Initialize Bridge (Reset recipient & secure 10 ETH in Escrow)
- [ ] **Step 2**: Verify Initial Balance (Expected: ~0.1 ETH)

### Phase 2: Compliance & Proof Transmission
- [ ] **Step 3**: Originate Proof (`/send-ccip`) - Audit bank & generate ZKP
- [ ] **Step 4**: Relay Proof (`/relay`) - Ferry attestation to destination

### Phase 3: Verification & Atomic Settlement
- [ ] **Step 5**: Check Firewall Status (`/status`) - Confirm gateway is OPEN
- [ ] **Step 6**: Atomic Settlement (`/release-funds`) - Disburse institutional payout

---

## 🛠 Active Task: Environment Handover
I have successfully:
1. Migrated all configuration to the new Tenderly Testnets.
2. Verified the `PRIVATE_KEY` across all environments.
3. Updated the REST gateway environment variables.

**The demo environment is fully calibrated for the new testnets. You are ready to start Terminal 1 & 2.**
