#!/bin/bash

echo "Starting Sentinel Firewall Flow Test..."

N8N_WEBHOOK_URL="http://localhost:5678/webhook/start-compliance"
CREDENTIAL="investor42"
DESTINATION="0x1234567890123456789012345678901234567890"
ASSET="0x0987654321098765432109876543210987654321"

echo "1. Triggering compliance request via n8n webhook..."
curl -X POST $N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "credential":"'$CREDENTIAL'",
    "destinationAddress":"'$DESTINATION'",
    "asset":"'$ASSET'",
    "amount":0
  }'

echo -e "\n\n2. Request sent. Please check:"
echo "   - n8n logs to verify Sentinel /trigger was called"
echo "   - Mock Bank logs to see the status check"
echo "   - Tenderly to see attestation creation and alert triggering"
echo "   - Sentinel logs to see the CCIP simulate and exact tx dispatch"

echo -e "\n3. To verify on destination chain, query the ComplianceGuard contract on Tenderly:"
echo "   Call whitelistExpiry($DESTINATION, $ASSET)"
