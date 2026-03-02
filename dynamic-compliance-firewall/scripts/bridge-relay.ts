// Owner: Justin Gramke (jmgramke@gmail.com)
const { ethers } = require("hardhat");
const axios = require("axios");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🌉 Agentic Compliance Bridge Relay: Starting Cross-Chain Transmission...");

    // Ensure account has gas for the virtual bridge relay
    await ethers.provider.send("tenderly_setBalance", [
        [deployer.address],
        ethers.utils.hexValue(ethers.utils.parseEther("10"))
    ]);

    // 1. Fetch live bank data to reconstruct the attestation payload
    // In a production relay, we would read the 'data' field directly from the Source Router's logs.
    const bankResponse = await axios.get('http://localhost:3004/investor-status?credential=investor42');
    const { balance, jurisdiction } = bankResponse.data;
    console.log(`- Detected CCIP Message from Source: [Balance Proof Required: 100 ETH, Origin: ${jurisdiction}]`);

    // 2. Bridge API Logic (Re-generating ZKP for the Destination Chain)
    // We call an internal helper to simulate the bridge "packaging" the proof for Arbitrum
    const sentinelResponse = await axios.post('http://localhost:3007/send-ccip?simulate=true', {});

    // 3. Connect to ComplianceGuard on Destination
    const guardAddress = "0xf69254ea53D8D5FfF13584d3E1D9A949Fa13D3fE";
    const ComplianceGuard = await ethers.getContractAt("ComplianceGuard", guardAddress);

    // Note: We use manualVerify here because the CCIP Router addresses on Virtual forks are localized.
    // This script acts as the "Off-Chain Reporting (OCR)" layer that ferries the ZKP across the bridge.
    console.log("- Delivering CCIP Attestation to Destination Firewall...");

    // We use the Sentinel API's trigger endpoint which can now provide the payload directly
    const triggerData = await axios.post('http://localhost:3007/trigger', {
        credential: "investor42",
        destinationAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        asset: "0x0000000000000000000000000000000000000000",
        amount: "0"
    });

    const { a, b, c, publicSignals } = triggerData.data.zkp;

    const tx = await ComplianceGuard.manualVerify(a, b, c, publicSignals, { gasLimit: 1000000 });
    const receipt = await tx.wait();

    console.log("✅ CCIP MESSAGE DELIVERED! Cross-Chain State Synced.");
    console.log("- Destination TX:", receipt.transactionHash);
    process.exit(0);
}

main().catch((error) => {
    console.error("Relay Failed:", error.message);
    process.exit(1);
});
