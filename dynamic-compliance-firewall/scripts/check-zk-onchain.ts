const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const path = require("path");

async function main() {
    const verifierAddress = "0x12262f2511cc2d369D026028126894be0f6dF3CC";
    const verifier = await ethers.getContractAt("Groth16Verifier", verifierAddress);

    // Inputs
    const bankBalance = 200000;
    const requiredBalance = 100000;
    const bankJurisdiction = 840;
    const allowedJurisdiction = 840;

    console.log("Generating proof for manual verification test...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
            userBankBalance: bankBalance.toString(),
            requiredBalance: requiredBalance.toString(),
            userJurisdiction: bankJurisdiction.toString(),
            allowedJurisdiction: allowedJurisdiction.toString()
        },
        path.resolve(__dirname, "../build/circuits/compliance_js/compliance.wasm"),
        path.resolve(__dirname, "../build/circuits/circuit_final.zkey")
    );

    console.log("Public Signals:", publicSignals);

    const a = [proof.pi_a[0], proof.pi_a[1]];
    const b = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
    ];
    const c = [proof.pi_c[0], proof.pi_c[1]];

    const isValid = await verifier.verifyProof(a, b, c, publicSignals);
    console.log("On-Chain Verification Result:", isValid);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
