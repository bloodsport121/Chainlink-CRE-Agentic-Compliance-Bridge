---
description: Ferry the ZKP across the virtual bridge to the destination firewall.
---
// turbo
1. Execute the relay command via the Sentinel API:
```powershell
node -e "fetch('http://localhost:3007/relay', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }).then(n=>n.json()).then(console.log)"
```
2. Look for the success message: "✅ COMPLIANCE ATTESTED! The Agentic Compliance Bridge is now OPEN for this institution."
