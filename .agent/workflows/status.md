---
description: Check the destination chain to see if the firewall is 🔥 OPEN.
---
// turbo
1. Execute the status check via the Sentinel API:
```powershell
node -e "fetch('http://localhost:3007/status').then(n=>n.json()).then(console.log)"
```
2. Confirm the response shows `firewall: 'OPEN'` and `status: '🔥'`.
