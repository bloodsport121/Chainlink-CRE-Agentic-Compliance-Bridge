---
description: 
---

# Agentic Compliance Bridge: 6-Step Demo Script 🚀

**Demo Reference URLs:**
*   **Left Side (Bank API):**  http://localhost:3004/investor-status?credential=investor42 
*   **Right Side (Bridge API):** http://localhost:3007/ 

---

## 💻 Terminal Setup (Run these first)

**Terminal 1: The TradFi Bank (Left)**
```powershell
cd c:\Users\jmgra\antigravityagents\.agent\workflows\chainlink-sentinel\dynamic-compliance-firewall\mock-bank
node index.js
```

**Terminal 2: The Agentic Compliance Bridge (Right)**
```powershell
cd c:\Users\jmgra\antigravityagents\.agent\workflows\chainlink-sentinel\dynamic-compliance-firewall\sentinel-rest
node index.js
```

**Terminal 3: The Operator (Execution)**
```powershell
cd c:\Users\jmgra\antigravityagents\.agent\workflows\chainlink-sentinel\dynamic-compliance-firewall

Follow the 6 steps below in this terminal

Follow this sequence in **Terminal 3** for the perfect "Zero-to-Hero" demonstration.

---

### **Phase 1: The Scene Setup (Redirection & Verification)**

**Step 1: Initialize the Bridge**  
Resets the recipient wallet and secures 10 ETH in the Escrow vault.

Command 1
node -e "fetch('http://localhost:3007/init', { method: 'POST' }).then(n=>n.json()).then(console.log)"


**Step 2: Verify Initial Balance**  
Confirms the recipient wallet starts with only gas (~0.1 ETH) and is not yet funded.

Command 2
node -e "fetch('http://localhost:3007/balance').then(n=>n.json()).then(console.log)"





### **Phase 2: The Compliance Chain (Audit & Transmission)**

**Step 3: Originate the proof (/send-ccip)**  
The Bridge Agent (Terminal 2) audits the bank and initiates the ZKP-wrapped CCIP message.
COMMAND 3
node -e "fetch('http://localhost:3007/send-ccip', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"


**Step 4: Relay the proof (/relay)**  
Ferries the cryptographic attestation across the virtual bridge to the destination firewall.

Command 4
node -e "fetch('http://localhost:3007/relay', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"



---

### **Phase 3: The Opening & Atomic Settlement**

**Step 5: Check Firewall Status (/status)**  
Confirms that the destination chain has accepted the proof and opened the gateway.
Command 5
node -e "fetch('http://localhost:3007/status').then(n=>n.json()).then(console.log)"


**Step 6: Atomic Settlement (/release-funds)**  
Triggers the final institutional payout from the vault to the recipient wallet.

Command 6
node -e "fetch('http://localhost:3007/release-funds', { method: 'POST', body: JSON.stringify({recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"




### **Summary of Results (Terminal 2 Logs)**
*   **Step 1**: `[ESCROW] Direct Deposit: 10.0 ETH secured in Vault.`
*   **Step 3**: `   - Payload: [ZKP - 100 ETH, 845 Geography Requirement]`
*   **Step 4**: `✅ COMPLIANCE ATTESTED! The Agentic Compliance Bridge is now OPEN...`
*   **Step 6**: `✅ [SETTLEMENT] Success! 10 ETH has been released.`
*   **Final Balance**: `10.1 ETH 💰`