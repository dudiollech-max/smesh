import { ethers } from "hardhat";

const SMESH_TOKEN  = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const FOUNDATION   = "0x715Eec1f3451aBd35bb0D2ac17d85086BC175A31";
// 200M total allocation - 10K already sent = 199,990,000 remaining
const AMOUNT       = ethers.parseEther("199990000");

async function main() {
  const [deployer] = await ethers.getSigners();
  const smesh = await ethers.getContractAt("SMESHToken", SMESH_TOKEN);

  const before = await smesh.balanceOf(FOUNDATION);
  console.log("Foundation balance before:", ethers.formatUnits(before, 18), "SMESH");
  console.log("Sending 199,990,000 SMESH → Foundation...");

  const tx = await smesh.transfer(FOUNDATION, AMOUNT);
  console.log("TX hash:", tx.hash);
  await tx.wait();

  const after = await smesh.balanceOf(FOUNDATION);
  console.log("✅ Foundation balance after:", ethers.formatUnits(after, 18), "SMESH");
  console.log("Basescan: https://basescan.org/tx/" + tx.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
