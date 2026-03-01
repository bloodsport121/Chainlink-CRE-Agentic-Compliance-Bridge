---
description: Start the Sentinel compliance process by generating a ZKP and sending a CCIP message from the source chain.
---
// turbo
1. Execute the CCIP send command via the Sentinel API:
```powershell
node -e "fetch('http://localhost:3007/send-ccip', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"
```
2. Verify the output in Terminal 2 shows "🚀 [SENTINEL] Cross-Chain Message Initiated...".
