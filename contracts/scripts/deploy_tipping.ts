import { ethers } from "hardhat";

const SMESH_TOKEN    = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const AGENT_REGISTRY = "0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF";
const ESCROW         = "0xC3B166c29A26DbD9Ba065Fb1a72e724Fc3105E6F";
const PROMO_AUCTION  = "0x191d931eeC1860EDFe4445a8E3e5D289BE4A207A";
const SPOTLIGHT      = "0xFdC1097c93eBC75d04041A0E9A56e8e35D41fDe2";

async function main() {
  const [deployer] = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const feeData = await ethers.provider.getFeeData();
  console.log("Deployer:", deployer.address);
  console.log("Nonce:", nonce);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const TREASURY = deployer.address;

  console.log("\nDeploying Tipping...");
  const Tipping = await ethers.getContractFactory("Tipping");
  const tipping = await Tipping.deploy(SMESH_TOKEN, AGENT_REGISTRY, TREASURY, {
    maxFeePerGas: (feeData.maxFeePerGas || BigInt(1000000000)) * BigInt(2),
    maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || BigInt(1000000000)) * BigInt(2),
  });
  await tipping.waitForDeployment();
  const tippingAddr = await tipping.getAddress();
  console.log("Tipping deployed to:", tippingAddr);

  // Grant remaining roles
  console.log("\nSetting roles...");
  const smeshToken = await ethers.getContractAt("SMESHToken", SMESH_TOKEN);
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  await (await smeshToken.grantRole(MINTER_ROLE, AGENT_REGISTRY)).wait();
  await (await smeshToken.grantRole(BURNER_ROLE, ESCROW)).wait();
  await (await smeshToken.grantRole(BURNER_ROLE, PROMO_AUCTION)).wait();
  await (await smeshToken.grantRole(BURNER_ROLE, tippingAddr)).wait();
  console.log("All roles granted");

  console.log("\n================================================");
  console.log("🚀 SMESH FULLY DEPLOYED ON BASE MAINNET ✅");
  console.log("================================================");
  console.log("SMESHToken:        0xDA31b578841d6d4417Dba55EFbdbF068e101a67a");
  console.log("TokenVesting:      0xd0ac3e32cC215c793f3BCE61d05157AdA380AED6");
  console.log("AgentRegistry:     0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF");
  console.log("Escrow:            0xC3B166c29A26DbD9Ba065Fb1a72e724Fc3105E6F");
  console.log("PromotionAuction:  0x191d931eeC1860EDFe4445a8E3e5D289BE4A207A");
  console.log("Spotlight:         0xFdC1097c93eBC75d04041A0E9A56e8e35D41fDe2");
  console.log("Tipping:          ", tippingAddr);
  console.log("================================================");
  console.log("Basescan: https://basescan.org/address/0xDA31b578841d6d4417Dba55EFbdbF068e101a67a");
}

main().catch((e) => { console.error(e); process.exit(1); });
