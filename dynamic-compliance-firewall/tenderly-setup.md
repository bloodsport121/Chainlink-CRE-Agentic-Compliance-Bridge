# Configure Tenderly Alerts

**Objective**: Provide step-by-step instructions for setting up the Tenderly Alert webhook to trigger n8n.

## Setup Instructions

1. Log in to your Tenderly Dashboard.
2. Navigate to **Alerts** → **Create New Alert**.
3. Choose the **"Smart Contract Event"** alert type.
4. Select your source chain DevNet and input the `ZKAttestation` contract address.
5. Choose the event: `AttestationCreated`.
6. Set the webhook URL to your n8n instance:  
   `https://your-n8n-instance.com/webhook/attestation-alert`  
   *(Replace with your actual n8n webhook URL. If running n8n locally, use ngrok to expose it.)*
7. Do not set any filters; leave it to trigger on every event.
8. Click **Save**.

## Testing the Alert
You can test the alert by emitting an event via Tenderly's transaction simulator or by running a successful trigger flow through the Sentinel endpoint and chain.
