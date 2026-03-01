import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log(`Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer address: ${deployer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
