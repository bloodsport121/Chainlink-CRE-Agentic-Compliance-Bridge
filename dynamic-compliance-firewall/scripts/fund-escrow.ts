import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const escrowAddress = "0xB9015b3F64552b7b5A45c09Fee8dc065ADcB3034";

    console.log("Funding escrow at:", escrowAddress);
    const tx = await deployer.sendTransaction({
        to: escrowAddress,
        value: ethers.utils.parseEther("10.0")
    });
    await tx.wait();
    console.log("Successfully funded escrow with 10 ETH");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
