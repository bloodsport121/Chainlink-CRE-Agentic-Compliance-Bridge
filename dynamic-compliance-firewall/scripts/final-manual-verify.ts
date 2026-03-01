const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const path = require("path");

async function main() {
    const guardAddress = "0xD4Cb73873539346E1C5b0958997E8a147964E2eD";
    const guard = await ethers.getContractAt("ComplianceGuard", guardAddress);

    const bankBalance = 200000;
    const requiredBalance = 100000;
    const bankJurisdiction = 840;
    const allowedJurisdiction = 840;

    console.log("Generating Proof...");
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

    const a = [proof.pi_a[0], proof.pi_a[1]];
    const b = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
    ];
    const c = [proof.pi_c[0], proof.pi_c[1]];

    console.log("Calling manualVerify on-chain...");
    const tx = await guard.manualVerify(a, b, c, publicSignals);
    await tx.wait();
    console.log("Manual verification Successful! Whitelist updated.");

    const expiry = await guard.whitelistExpiry("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000");
    console.log("New Whitelist Expiry:", expiry.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
