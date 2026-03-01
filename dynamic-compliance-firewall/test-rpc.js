const { ethers } = require("ethers");
require("dotenv").config();
async function main() {
    console.log("Source URL:", process.env.TENDERLY_SOURCE_RPC);
    const pSource = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_SOURCE_RPC);
    const nSource = await pSource.getNetwork();
    console.log("Source Network:", nSource);

    console.log("Dest URL:", process.env.TENDERLY_DESTINATION_RPC);
    const pDest = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_DESTINATION_RPC);
    const nDest = await pDest.getNetwork();
    console.log("Dest Network:", nDest);
}
main().catch(console.error);
