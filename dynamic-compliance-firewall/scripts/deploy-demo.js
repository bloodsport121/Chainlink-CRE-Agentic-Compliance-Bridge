const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    const verifierAddress = "0x8055d40e8099E26F699Cf7f39dC6257Ff86aC3FA";
    const routerAddress = "0x0000000000000000000000000000000000000000"; // Dummy router since manualVerify is what matters for demo

    const cgArt = require("../artifacts/contracts/ComplianceGuard.sol/ComplianceGuard.json");
    const ComplianceGuardFactory = new ethers.ContractFactory(cgArt.abi, cgArt.bytecode, deployer);

    console.log("Deploying ComplianceGuard with manualVerify...");
    const complianceGuard = await ComplianceGuardFactory.deploy(routerAddress, verifierAddress);
    await complianceGuard.deployed();
    console.log("ComplianceGuard deployed to:", complianceGuard.address);

    // Also deploy a new Escrow that points to this one
    const escrowArt = require("../artifacts/contracts/InstitutionalEscrow.sol/InstitutionalEscrow.json");
    const EscrowFactory = new ethers.ContractFactory(escrowArt.abi, escrowArt.bytecode, deployer);
    const escrow = await EscrowFactory.deploy(complianceGuard.address);
    await escrow.deployed();
    console.log("Escrow deployed to:", escrow.address);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
