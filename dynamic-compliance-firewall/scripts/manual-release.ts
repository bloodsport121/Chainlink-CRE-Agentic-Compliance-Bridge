const { ethers } = require("hardhat");

async function main() {
    const escrowAddress = "0xB9015b3F64552b7b5A45c09Fee8dc065ADcB3034";
    const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    console.log("Attempting Direct Escrow Release from Script...");
    const Escrow = await ethers.getContractAt("InstitutionalEscrow", escrowAddress);

    // Check Guard status one more time before calling
    const guardAddress = await Escrow.complianceGuard();
    const ComplianceGuard = await ethers.getContractAt("ComplianceGuard", guardAddress);
    const expiry = await ComplianceGuard.whitelistExpiry(ethers.constants.AddressZero, ethers.constants.AddressZero);

    console.log("- Escrow Linked Guard:", guardAddress);
    console.log("- Firewall Status:", expiry.gt(0) ? "🔥 OPEN" : "🧊 LOCKED");

    if (expiry.eq(0)) {
        throw new Error("CANNOT RELEASE: Firewall is still LOCKED on-chain.");
    }

    const tx = await Escrow.releaseEth(recipient, { gasLimit: 1000000 });
    console.log("- Transaction Sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ SUCCESS! 10 ETH released from Escrow to:", recipient);

    process.exit(0);
}

main().catch((error) => {
    console.error("Manual Release Failed:", error.message);
    process.exitCode = 1;
});
