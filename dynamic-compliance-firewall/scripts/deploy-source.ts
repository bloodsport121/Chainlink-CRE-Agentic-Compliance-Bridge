// Owner: Justin Gramke (jmgramke@gmail.com)
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts on SOURCE chain with account:", deployer.address);

    await ethers.provider.send("tenderly_setBalance", [
        [deployer.address],
        ethers.utils.hexValue(ethers.utils.parseEther("100"))
    ]);

    const ccipArt = require("../artifacts/@chainlink/local/src/ccip/CCIPLocalSimulator.sol/CCIPLocalSimulator.json");
    const CCIPLocalSimulatorFactory = new ethers.ContractFactory(ccipArt.abi, ccipArt.bytecode, deployer);
    const ccipSimulator = await CCIPLocalSimulatorFactory.deploy();
    await ccipSimulator.deployed();
    console.log("CCIPLocalSimulator (Source) deployed to:", ccipSimulator.address);

    const zkArt = require("../artifacts/contracts/ZKAttestation.sol/ZKAttestation.json");
    const ZKAttestationFactory = new ethers.ContractFactory(zkArt.abi, zkArt.bytecode, deployer);
    const zkAttestation = await ZKAttestationFactory.deploy();
    await zkAttestation.deployed();
    console.log("ZKAttestation deployed to:", zkAttestation.address);

    const fcArt = require("../artifacts/contracts/FunctionsConsumer.sol/FunctionsConsumer.json");
    const FunctionsConsumerFactory = new ethers.ContractFactory(fcArt.abi, fcArt.bytecode, deployer);
    const config = await ccipSimulator.configuration();
    const functionsConsumer = await FunctionsConsumerFactory.deploy(config.sourceRouter_, zkAttestation.address);
    await functionsConsumer.deployed();
    console.log("FunctionsConsumer deployed to:", functionsConsumer.address);

    await zkAttestation.setFunctionsConsumer(functionsConsumer.address);
    console.log("Set FunctionsConsumer address in ZKAttestation");

    const deployments = {
        ccipSimulator: ccipSimulator.address,
        zkAttestation: zkAttestation.address,
        functionsConsumer: functionsConsumer.address
    };

    if (!fs.existsSync("deployments")) fs.mkdirSync("deployments");
    fs.writeFileSync("deployments/source.json", JSON.stringify(deployments, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
