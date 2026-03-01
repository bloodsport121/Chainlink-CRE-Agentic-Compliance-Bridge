const hre = require("hardhat");

async function main() {
    await hre.run("compile");
    console.log("Compilation Successful!");
}

main().catch((error) => {
    console.error("Compilation Error:", error);
    process.exitCode = 1;
});
