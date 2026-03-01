import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts on DESTINATION chain with account:", deployer.address);

    await ethers.provider.send("tenderly_setBalance", [
        [deployer.address],
        ethers.utils.hexValue(ethers.utils.parseEther("100"))
    ]);

    const ccipArt = require("../artifacts/@chainlink/local/src/ccip/CCIPLocalSimulator.sol/CCIPLocalSimulator.json");
    const CCIPLocalSimulatorFactory = new ethers.ContractFactory(ccipArt.abi, ccipArt.bytecode, deployer);
    const ccipSimulator = await CCIPLocalSimulatorFactory.deploy();
    await ccipSimulator.deployed();
    console.log("CCIPLocalSimulator (Dest) deployed to:", ccipSimulator.address);

    const verifierArt = require("../artifacts/contracts/Verifier.sol/Groth16Verifier.json");
    const VerifierFactory = new ethers.ContractFactory(verifierArt.abi, verifierArt.bytecode, deployer);
    const verifier = await VerifierFactory.deploy();
    await verifier.deployed();
    console.log("Groth16 Verifier deployed to:", verifier.address);

    const cgArt = require("../artifacts/contracts/ComplianceGuard.sol/ComplianceGuard.json");
    const ComplianceGuardFactory = new ethers.ContractFactory(cgArt.abi, cgArt.bytecode, deployer);
    const config = await ccipSimulator.configuration();
    const complianceGuard = await ComplianceGuardFactory.deploy(config.destinationRouter_, verifier.address);
    await complianceGuard.deployed();
    console.log("ComplianceGuard deployed to:", complianceGuard.address);

    const escrowArt = require("../artifacts/contracts/InstitutionalEscrow.sol/InstitutionalEscrow.json");
    const EscrowFactory = new ethers.ContractFactory(escrowArt.abi, escrowArt.bytecode, deployer);
    const escrow = await EscrowFactory.deploy(complianceGuard.address);
    await escrow.deployed();
    console.log("InstitutionalEscrow deployed to:", escrow.address);

    const deployments = {
        ccipSimulator: ccipSimulator.address,
        verifier: verifier.address,
        complianceGuard: complianceGuard.address,
        escrow: escrow.address
    };

    if (!fs.existsSync("deployments")) fs.mkdirSync("deployments");
    fs.writeFileSync("deployments/destination.json", JSON.stringify(deployments, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
