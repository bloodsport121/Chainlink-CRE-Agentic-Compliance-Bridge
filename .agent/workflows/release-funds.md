---
description: Trigger the final payout from the Institutional Escrow vault.
---
// turbo
1. Execute the fund release via the Sentinel API:
```powershell
node -e "fetch('http://localhost:3007/release-funds', { method: 'POST', body: JSON.stringify({recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"
```
2. Look for the success message: "✅ [SETTLEMENT] Success! 10 ETH has been released to the compliant institution."
