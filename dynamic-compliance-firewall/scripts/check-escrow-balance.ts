const { ethers } = require("hardhat");

async function main() {
    const escrowAddress = "0x1c815B1FFEF3c5F4F6EA64C6a21a7e93076b2eba";
    const balance = await ethers.provider.getBalance(escrowAddress);

    console.log("Escrow Address:", escrowAddress);
    console.log("Escrow Balance:", ethers.utils.formatEther(balance), "ETH");

    const guardAddress = "0xf69254ea53D8D5FfF13584d3E1D9A949Fa13D3fE";
    const Escrow = await ethers.getContractAt("InstitutionalEscrow", escrowAddress);
    const linkedGuard = await Escrow.complianceGuard();
    console.log("Escrow's Linked Guard:", linkedGuard);
    console.log("Actual Compliance Guard:", guardAddress);

    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
