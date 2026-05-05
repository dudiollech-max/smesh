import { ethers } from "hardhat";

const SMESH_TOKEN    = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const FOUNDATION     = "0x715Eec1f3451aBd35bb0D2ac17d85086BC175A31";
const TEST_AMOUNT    = ethers.parseEther("10000"); // 10,000 SMESH

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Sending from:", deployer.address);
  console.log("Sending to:  ", FOUNDATION);
  console.log("Amount:       10,000 SMESH");

  const smesh = await ethers.getContractAt("SMESHToken", SMESH_TOKEN);

  // Check deployer balance first
  const balance = await smesh.balanceOf(deployer.address);
  console.log("Deployer SMESH balance:", ethers.formatEther(balance));

  const tx = await smesh.transfer(FOUNDATION, TEST_AMOUNT);
  console.log("TX hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();

  const newBalance = await smesh.balanceOf(FOUNDATION);
  console.log("✅ Foundation wallet SMESH balance:", ethers.formatEther(newBalance));
  console.log("Basescan: https://basescan.org/tx/" + tx.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
