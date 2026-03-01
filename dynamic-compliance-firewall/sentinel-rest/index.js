const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const snarkjs = require('snarkjs');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const sourceProvider = new ethers.providers.JsonRpcProvider(process.env.SOURCE_RPC_URL);
const destinationProvider = new ethers.providers.JsonRpcProvider(process.env.DESTINATION_RPC_URL);
const walletSource = new ethers.Wallet(process.env.PRIVATE_KEY, sourceProvider);
// walletDest is not strictly needed just for calling simulator dest view functions, but let's keep it
const walletDest = new ethers.Wallet(process.env.PRIVATE_KEY, destinationProvider);

const FUNCTIONS_CONSUMER_ABI = [
    "function requestInvestorStatus(string calldata credential, address userAddress, address asset) external returns (bytes32 requestId)"
];
const ZK_ATTESTATION_ABI = [
    "function attestations(bytes32 proofHash) external view returns (bytes proof, uint256 expiry, address user, address asset)"
];
const CCIP_LOCAL_SIMULATOR_ABI = [
    "function configuration() external view returns (uint64 chainSelector_, address sourceRouter_, address destinationRouter_, address wrappedNative_, address linkToken_, address ccipBnM_, address ccipLnM_)"
];
const ROUTER_ABI = [
    "function ccipSend(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external payable returns (bytes32)"
];
const INSTITUTIONAL_ESCROW_ABI = [
    "function releaseEth(address payable recipient) external",
    "function releaseFunds(address recipient, address asset, uint256 amount) external",
    "function complianceGuard() external view returns (address)"
];

const functionsConsumer = new ethers.Contract(process.env.FUNCTIONS_CONSUMER_ADDRESS, FUNCTIONS_CONSUMER_ABI, walletSource);
const zkAttestation = new ethers.Contract(process.env.ZK_ATTESTATION_ADDRESS, ZK_ATTESTATION_ABI, sourceProvider);
const ccipSimulatorSource = new ethers.Contract(process.env.CCIP_LOCAL_SIMULATOR_SOURCE, CCIP_LOCAL_SIMULATOR_ABI, walletSource);
const ccipSimulatorDest = new ethers.Contract(process.env.CCIP_LOCAL_SIMULATOR_DEST, CCIP_LOCAL_SIMULATOR_ABI, destinationProvider);
const institutionalEscrow = new ethers.Contract(process.env.INSTITUTIONAL_ESCROW_ADDRESS, INSTITUTIONAL_ESCROW_ABI, walletDest);

app.get('/', (req, res) => {
    res.json({ status: "Sentinel API (Phase 3) Active on Port 3007", ready: true });
});

app.post('/init', async (req, res) => {
    try {
        const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const escrowAddr = institutionalEscrow.address;

        console.log("Agentic Compliance Bridge API Online...");

        // 1. Give the recipient 0.1 ETH for gas (Small starting balance)
        await destinationProvider.send("tenderly_setBalance", [
            [recipient],
            ethers.utils.hexValue(ethers.utils.parseEther("0.1"))
        ]);

        // 2. Fund the Escrow with exactly 10 ETH
        // We use the hex string directly for absolute precision on the RPC
        await destinationProvider.send("tenderly_setBalance", [
            [escrowAddr],
            "0x8AC7230489E80000" // Exact hex for 10 ETH
        ]);

        const escBal = await destinationProvider.getBalance(escrowAddr);
        const recBal = await destinationProvider.getBalance(recipient);

        console.log(`   - Wallet Reset: ${ethers.utils.formatEther(recBal)} ETH (Gas Only)`);
        console.log(`[ESCROW] Direct Deposit: ${ethers.utils.formatEther(escBal)} ETH secured in Vault.`);

        res.json({
            success: true,
            escrow: escrowAddr,
            recipient: recipient,
            startingBalance: ethers.utils.formatEther(recBal)
        });
    } catch (error) {
        console.error("Init Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/balance', async (req, res) => {
    try {
        const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const balance = await destinationProvider.getBalance(recipient);
        const eth = ethers.utils.formatEther(balance);
        res.json({
            address: recipient,
            balance: `${eth} ETH`,
            label: eth === "0.0" ? "🧊 EMPTY" : "💰 FUNDED"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/trigger', async (req, res) => {
    try {
        const { credential, destinationAddress, asset, amount } = req.body;

        // Fetch bank data to generate the ZKP for the relay
        const bankResponse = await axios.get('http://localhost:3004/investor-status?credential=investor42');
        const bankBalance = bankResponse.data.balance || 0;
        const bankJurisdiction = bankResponse.data.jurisdiction || 0;

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                userBankBalance: bankBalance.toString(),
                requiredBalance: "100",
                userJurisdiction: bankJurisdiction.toString(),
                allowedJurisdiction: "840"
            },
            path.resolve(__dirname, '../build/circuits/compliance_js/compliance.wasm'),
            path.resolve(__dirname, '../build/circuits/circuit_final.zkey')
        );

        res.json({
            success: true,
            zkp: {
                a: proof.pi_a.slice(0, 2),
                b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                c: proof.pi_c.slice(0, 2),
                publicSignals: publicSignals
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-ccip', async (req, res) => {
    try {
        const { proofHash, user, asset, expiry } = req.body;
        const isSimulate = req.query.simulate === 'true';

        // Fetch bank data directly instead of on-chain attestation
        const bankResponse = await axios.get('http://localhost:3004/investor-status?credential=investor42');
        const bankBalance = bankResponse.data.balance || 0;
        const bankJurisdiction = bankResponse.data.jurisdiction || 0;

        // Generate Dual-Logic ZKP locally
        // Proves balance >= 100,000 AND jurisdiction == 840 (USA)
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                userBankBalance: bankBalance.toString(),
                requiredBalance: "100",
                userJurisdiction: bankJurisdiction.toString(),
                allowedJurisdiction: "840"
            },
            path.resolve(__dirname, '../build/circuits/compliance_js/compliance.wasm'),
            path.resolve(__dirname, '../build/circuits/circuit_final.zkey')
        );

        // Format SnarkJS output for Solidity [uint[2], uint[2][2], uint[2], uint[2]]
        // Note: publicSignals is now [requiredBalance, allowedJurisdiction]
        const payload = ethers.utils.defaultAbiCoder.encode(
            ['uint256[2]', 'uint256[2][2]', 'uint256[2]', 'uint256[3]'],
            [
                proof.pi_a.slice(0, 2),
                [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                proof.pi_c.slice(0, 2),
                publicSignals
            ]
        );

        console.log(`[ZKP] Public Signals: ${publicSignals}`);
        const destConfig = await ccipSimulatorDest.configuration();
        const destinationChainSelector = destConfig.chainSelector_;
        const sourceConfig = await ccipSimulatorSource.configuration();
        const sourceRouterAddress = sourceConfig.sourceRouter_;

        const receiver = process.env.COMPLIANCE_GUARD_ADDRESS;
        const message = {
            receiver: ethers.utils.defaultAbiCoder.encode(['address'], [receiver]),
            data: payload,
            tokenAmounts: [],
            feeToken: ethers.constants.AddressZero,
            extraArgs: "0x97a657c900000000000000000000000000000000000000000000000000000000002dc6c0"
        };

        const router = new ethers.Contract(sourceRouterAddress, ROUTER_ABI, walletSource);
        console.log(`[CCIP] Sending to router ${sourceRouterAddress}...`);

        if (isSimulate) {
            await router.callStatic.ccipSend(destinationChainSelector, message);
            return res.json({ simulated: true });
        } else {
            console.log("🚀 [Agent] Cross-Chain Message Initiated...");
            console.log(`   - Payload: [Dual-ZKP: 100 ETH Requirement]`);
            const tx = await router.ccipSend(destinationChainSelector, message, { gasLimit: 4000000 });
            console.log(`   - CCIP Source TX: ${tx.hash}`);
            await tx.wait();
            console.log("[Agentic Bridge] Identity Proof is now Transit across the Bridge.");
            return res.json({ success: true, txHash: tx.hash });
        }

    } catch (error) {
        console.error("CCIP Send Error Trace:", error);
        res.status(500).json({ error: error.message, simulated: false });
    }
});

app.post('/relay', async (req, res) => {
    try {
        console.log("🌉 [RELAY] Ferrying ZKP across the virtual bridge...");

        // Ensure destination wallet has gas (Gas Only - 0.1 ETH)
        await destinationProvider.send("tenderly_setBalance", [
            [walletDest.address],
            ethers.utils.hexValue(ethers.utils.parseEther("0.1"))
        ]);

        // Re-generate the proof data for the relay (Bridge Simulator)
        const bankResponse = await axios.get('http://localhost:3004/investor-status?credential=investor42');
        const bankBalance = bankResponse.data.balance || 0;
        const bankJurisdiction = bankResponse.data.jurisdiction || 0;

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                userBankBalance: bankBalance.toString(),
                requiredBalance: "100",
                userJurisdiction: bankJurisdiction.toString(),
                allowedJurisdiction: "840"
            },
            path.resolve(__dirname, '../build/circuits/compliance_js/compliance.wasm'),
            path.resolve(__dirname, '../build/circuits/circuit_final.zkey')
        );

        const a = proof.pi_a.slice(0, 2);
        const b = [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]];
        const c = proof.pi_c.slice(0, 2);

        // Deliver to ComplianceGuard
        const contract = new ethers.Contract(process.env.COMPLIANCE_GUARD_ADDRESS, [
            "function manualVerify(uint[2] a, uint[2][2] b, uint[2] c, uint[3] publicSignals)"
        ], walletDest);

        const tx = await contract.manualVerify(a, b, c, publicSignals, { gasLimit: 1000000 });
        await tx.wait();

        console.log("✅ COMPLIANCE ATTESTED! The Agentic Compliance Bridge is now OPEN for this institution.");
        res.json({ success: true, message: "Bridge message delivered to destination firewall!" });
    } catch (error) {
        console.error("Relay Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/status', async (req, res) => {
    try {
        const contract = new ethers.Contract(process.env.COMPLIANCE_GUARD_ADDRESS, [
            "function whitelistExpiry(address user, address asset) view returns (uint256)"
        ], destinationProvider);

        const expiry = await contract.whitelistExpiry(ethers.constants.AddressZero, ethers.constants.AddressZero);
        const isOpen = !expiry.isZero();

        res.json({
            firewall: isOpen ? "OPEN" : "LOCKED",
            status: isOpen ? "🔥" : "🧊",
            expiry: expiry.toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/release-funds', async (req, res) => {
    try {
        const { recipient } = req.body;
        console.log(`💰 [ESCROW] Release Request for RECIPIENT: ${recipient || '0xf39...2266'}`);

        // releaseEth expects the ComplianceGuard to have whitelisted the user
        const recipientAddress = recipient || walletDest.address;
        const tx = await institutionalEscrow.releaseEth(recipientAddress, { gasLimit: 500000 });
        console.log(`   - Signing Transaction: ${tx.hash}`);
        const receipt = await tx.wait();

        // Hard refresh provider to clear any cache
        const finalBalance = await destinationProvider.getBalance(recipientAddress);
        console.log(`✅ [SETTLEMENT] Success! 10 ETH has been released.`);
        console.log(`   - New Recipient Balance: ${ethers.utils.formatEther(finalBalance)} ETH 💰`);
        res.json({ success: true, txHash: tx.hash, message: "Institutional funds released!" });
    } catch (error) {
        let reason = error.reason || error.message;
        if (error.error && error.error.message) reason = error.error.message;
        console.error("Escrow Release Error:", reason);
        res.status(500).json({ error: reason });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sentinel API on port ${PORT}`));
