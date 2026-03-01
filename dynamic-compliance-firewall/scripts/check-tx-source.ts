const { ethers } = require("hardhat");

async function main() {
    const txHash = "0x94b5d4b7848eb037f6687d8b644f419d8d75b300e4ff193d8ba73c1207bcf917";
    const receipt = await ethers.provider.getTransactionReceipt(txHash);

    if (!receipt) {
        console.log("Transaction not found.");
        return;
    }

    console.log("Status:", receipt.status === 1 ? "Success" : "Failure");

    // Check for CCIP Router Mock events
    // MockCCIPRouter.ccipSend will emit CCIPSendRequested (id, message)
    console.log("Logs count:", receipt.logs.length);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
