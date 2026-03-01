const { ethers } = require("ethers");
require('dotenv').config({ path: 'c:/Users/jmgra/antigravityagents/.agent/workflows/chainlink-sentinel/dynamic-compliance-firewall/sentinel-rest/.env' });

async function check() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.DESTINATION_RPC_URL);
    const escrow = process.env.INSTITUTIONAL_ESCROW_ADDRESS;

    console.log(`Setting Escrow balance for ${escrow}...`);
    // Try the array-of-array format that worked in finalize-compliance
    await provider.send("tenderly_setBalance", [
        [escrow],
        ethers.utils.hexValue(ethers.utils.parseEther("10"))
    ]);

    const balance = await provider.getBalance(escrow);
    console.log(`New Escrow Balance: ${ethers.utils.formatEther(balance)} ETH`);
}

check().catch(console.error);
