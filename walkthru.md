Walkthru: # Testing Dynamic Compliance Firewall on Tenderly

This guide details how to test the `DynamicComplianceFirewall` live across two Tenderly DevNets, along with instructions on how to upgrade the current ECDSA-based system to a true Zero-Knowledge Proof (ZKP) using Circom.

## Phase 1: Testing the Current System (ECDSA Mock ZKP)

### 1. Setup Tenderly DevNets
1. Go to your [Tenderly Dashboard](https://dashboard.tenderly.co/).
2. Create two new **DevNets**:
   *   Name one **Source Chain** (e.g., Forking Ethereum Mainnet).
   *   Name the other **Destination Chain** (e.g., Forking Arbitrum).
3. Copy the RPC URLs for both DevNets.

### 2. Configure Environment variables
In the root `dynamic-compliance-firewall` folder, open `.env` and fill in the RPCs along with a test private key (Tenderly accounts come pre-funded):
```env
PRIVATE_KEY=your_test_private_key
TENDERLY_SOURCE_RPC=https://rpc.tenderly.co/fork/...
TENDERLY_DESTINATION_RPC=https://rpc.tenderly.co/fork/...
```

### 3. Deploy Smart Contracts
Deploy your contracts to both chains using Hardhat:
```bash
npx hardhat run scripts/deploy-source.ts --network tenderly_source
npx hardhat run scripts/deploy-destination.ts --network tenderly_destination
```
*(Make sure to copy the deployed contract addresses into `sentinel-rest/.env`)*

### 4. Setup Off-Chain APIs
Open two new terminal windows:
```bash
# Terminal 1: Start Mock Bank
cd mock-bank
node index.js
```

```bash
# Terminal 2: Start Sentinel REST API
cd sentinel-rest
npm install
node index.js
```

### 5. Execute the Flow
Run the test script to trigger the full compliance flow:
```bash
./test.sh
```
1. You will see a `requestInvestorStatus` transaction hit the Source DevNet.
2. The mock Chainlink Functions execution returns the signed proof.
3. The Sentinel circuit breaker simulates the CCIP transaction.
4. If successful, `ccipSend` is executed.
5. In the Tenderly Dashboard on your **Destination** DevNet, look at the Transactions tab. You should see `_ccipReceive` executed, emitting the `WhitelistGranted` event.

---

## Phase 2: Enabling a Real ZKP Transaction

To upgrade this system to use a *real* ZKP (proving you have the required credentials without revealing them to the blockchain), follow these steps to integrate **Circom** and **SnarkJS**.

### 1. Create the ZK Circuit
Install Circom globally on your machine.
Create a file named `compliance.circom`:
```circom
pragma circom 2.0.0;
include "node_modules/circomlib/circuits/comparators.circom";

// Proves userBankBalance >= requiredBalance without revealing userBankBalance
template AccreditedInvestor() {
    signal input userBankBalance; // Private to the user/bank
    signal input requiredBalance; // Public requirement on-chain

    signal output isCompliant;

    component balanceCheck = GreaterEqThan(64);
    balanceCheck.in[0] <== userBankBalance;
    balanceCheck.in[1] <== requiredBalance;
    balanceCheck.out === 1;

    isCompliant <== 1;
}
component main {public [requiredBalance]} = AccreditedInvestor();
```

### 2. Compile and Generate the Verifier
Compile the circuit and run the SnarkJS Groth16 trusted setup. Then generate the Solidity verifier:
```bash
# Generate the Solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey Verifier.sol
```
Move `Verifier.sol` into your `contracts/` directory and deploy it to your **Destination Chain**.

### 3. Update the Compliance Guard
Update `ComplianceGuard.sol` to inherit/interface with the new `Verifier.sol` instead of using `ecrecover()`.
```solidity
interface IVerifier {
    function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory input) external view returns (bool);
}

// ... inside ccipReceive ...
(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[2] memory publicInputs) = abi.decode(any2EvmMessage.data, (uint[2], uint[2][2], uint[2], uint[2]));

bool isValid = IVerifier(verifierAddress).verifyProof(a, b, c, publicInputs);
require(isValid, "ZK Proof is invalid!");
```

### 4. Update the Sentinel API CCIP Payload
In `sentinel-rest/index.js`, install `snarkjs`. When the Sentinel intercepts the alert, it fetches the raw data from the Bank API, generates the ZK Proof locally, and ABI-encodes the arrays into the CCIP Payload:

```javascript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { userBankBalance: "200000", requiredBalance: "100000" }, 
    "compliance.wasm", 
    "circuit_final.zkey"
);

// Format SnarkJS output to match Solidity struct formats
const payload = ethers.utils.defaultAbiCoder.encode(
  ['uint256[2]', 'uint256[2][2]', 'uint256[2]', 'uint256[2]'],
  [proof.pi_a.slice(0, 2), [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]], proof.pi_c.slice(0, 2), publicSignals]
);
```

### 5. Test ZKP on Tenderly
1. Redeploy `ComplianceGuard.sol` and `Verifier.sol` to your Destination DevNet.
2. Restart the Sentinel REST API.
3. Run `./test.sh` again. 
4. Head to the Destination DevNet dashboard in Tenderly. You will literally see the `verifyProof` execution run inside the `ccipReceive` transaction, cryptographically validating the Groth16 math instantly without gas fees during testing!