#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "1. Checking circomlib..."
npm install circomlib snarkjs

mkdir -p build/circuits
cd build/circuits

echo "2. Compiling the circuit..."
circom ../../circuits/compliance.circom --r1cs --wasm --sym

echo "3. Downloading Powers of Tau file..."
if [ ! -f "pot12_final.ptau" ]; then
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o pot12_final.ptau
fi

echo "4. Running Groth16 Setup..."
npx snarkjs groth16 setup compliance.r1cs pot12_final.ptau circuit_0000.zkey

echo "5. Generating Final Zkey..."
echo "test-random-text" | npx snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor" -v

echo "6. Exporting Verification Key..."
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo "7. Exporting Solidity Verifier..."
npx snarkjs zkey export solidityverifier circuit_final.zkey ../../contracts/Verifier.sol

echo "Success! ZK Circuit compiled and Verifier generated in contracts/Verifier.sol"
