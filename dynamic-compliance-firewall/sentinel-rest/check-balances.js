const { ethers } = require("ethers");
require('dotenv').config({ path: 'c:/Users/jmgra/antigravityagents/.agent/workflows/chainlink-sentinel/dynamic-compliance-firewall/sentinel-rest/.env' });

async function check() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.DESTINATION_RPC_URL);
    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const escrow = process.env.INSTITUTIONAL_ESCROW_ADDRESS;

    console.log("Checking Balances on Destination Chain...");
    console.log(`Recipient (${recipient}): ${ethers.utils.formatEther(await provider.getBalance(recipient))} ETH`);
    console.log(`Escrow (${escrow}): ${ethers.utils.formatEther(await provider.getBalance(escrow))} ETH`);
}

check().catch(console.error);
