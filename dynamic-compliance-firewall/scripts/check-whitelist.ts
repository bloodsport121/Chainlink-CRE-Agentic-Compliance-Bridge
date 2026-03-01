const { ethers } = require("hardhat");

async function main() {
    const guardAddress = "0xf69254ea53D8D5FfF13584d3E1D9A949Fa13D3fE";
    const ComplianceGuard = await ethers.getContractAt("ComplianceGuard", guardAddress);

    // address(0) for demo
    const expiry = await ComplianceGuard.whitelistExpiry(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000"
    );

    console.log("Current Whitelist Status (address 0):", expiry.toString() !== "0" ? "🔥 OPEN" : "🧊 LOCKED");
    if (expiry.toString() !== "0") {
        console.log("Whitelist Expiry:", expiry.toString());
    }
    console.log("Current Block Timestamp:", Math.floor(Date.now() / 1000));

    // Stop polling to see if it prevents the "hang"
    ethers.provider.polling = false;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
