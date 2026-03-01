const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const path = require("path");
const axios = require("axios");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Confirming Compliance on Destination via Finalizer...");

    // Ensure account has gas for the video demo
    await ethers.provider.send("tenderly_setBalance", [
        [deployer.address],
        ethers.utils.hexValue(ethers.utils.parseEther("10"))
    ]);

    const bankResponse = await axios.get('http://localhost:3004/investor-status?credential=investor42');
    const { balance, jurisdiction } = bankResponse.data;
    console.log(`- Bank Data Fetched: Balance=$${balance}, Country=${jurisdiction}`);

    // 2. Generate the ZKP locally (same logic as API)
    console.log("- Generating Zero-Knowledge Proof (Dual-Logic)...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
            userBankBalance: balance.toString(),
            requiredBalance: "100",
            userJurisdiction: jurisdiction.toString(),
            allowedJurisdiction: "840"
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

    // 3. Connect to ComplianceGuard on Destination
    const guardAddress = "0xf69254ea53D8D5FfF13584d3E1D9A949Fa13D3fE";
    const ComplianceGuard = await ethers.getContractAt("ComplianceGuard", guardAddress);

    console.log("- Transmitting ZK-Attestation to Destination firewall...");
    const tx = await ComplianceGuard.manualVerify(a, b, c, publicSignals, { gasLimit: 1000000 });
    await tx.wait();

    console.log("✅ COMPLIANCE ATTESTED! The Sentinel Firewall is now OPEN for this institution.");

    // Windows Fix: Wait 500ms before hard exit to allow handles to clean up
    await new Promise(resolve => setTimeout(resolve, 500));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
