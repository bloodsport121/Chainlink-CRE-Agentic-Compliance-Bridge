const credential = args[0];
const userAddress = args[1];
const asset = args[2];

const bankResponse = await Functions.makeHttpRequest({
    url: secrets.bankApiUrl,
    params: { credential: credential },
    headers: { 'x-api-key': secrets.apiKey || 'dummy' }
});

if (bankResponse.error || !bankResponse.data || bankResponse.data.qualified !== true) {
    throw new Error("User is not qualified");
}

const privateKey = secrets.donSigningKey;
const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 hours

const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'address', 'uint256'],
    [userAddress, asset, expiry]
);

const signingKey = new ethers.utils.SigningKey(privateKey);
const signature = signingKey.signDigest(ethers.utils.arrayify(messageHash));
const proof = ethers.utils.joinSignature(signature);

const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'bytes', 'address', 'address'],
    [expiry, proof, userAddress, asset]
);

return Buffer.from(encoded.slice(2), 'hex');
