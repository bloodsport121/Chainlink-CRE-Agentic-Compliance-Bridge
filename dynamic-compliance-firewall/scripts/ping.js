const { ethers } = require("hardhat"); e = async () => { try { console.log(await ethers.provider.getBlockNumber()); } catch (e) { console.error(e); } }; e();
