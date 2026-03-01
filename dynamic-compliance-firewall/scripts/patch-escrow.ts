const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Updating Institutional Escrow on Destination...");

    const guardAddress = "0xf69254ea53D8D5FfF13584d3E1D9A949Fa13D3fE";
    const EscrowFactory = await ethers.getContractFactory("InstitutionalEscrow");
    const escrow = await EscrowFactory.deploy(guardAddress);
    await escrow.deployed();

    console.log("New InstitutionalEscrow deployed to:", escrow.address);

    // Save update
    const destPath = path.join(__dirname, "../deployments/destination.json");
    const destData = JSON.parse(fs.readFileSync(destPath, "utf8"));
    destData.escrow = escrow.address;
    fs.writeFileSync(destPath, JSON.stringify(destData, null, 2));

    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
