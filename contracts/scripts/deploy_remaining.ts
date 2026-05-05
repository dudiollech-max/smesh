import { ethers } from "hardhat";

// Already deployed
const SMESH_TOKEN    = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const TOKEN_VESTING  = "0xd0ac3e32cC215c793f3BCE61d05157AdA380AED6";
const AGENT_REGISTRY = "0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF";
const ESCROW         = "0xC3B166c29A26DbD9Ba065Fb1a72e724Fc3105E6F";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying remaining contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Get current nonce
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Current nonce:", nonce);

  // AgentRegistry + Escrow already deployed
  console.log("AgentRegistry (existing):", AGENT_REGISTRY);
  console.log("Escrow (existing):       ", ESCROW);

  // Treasury + Foundation = deployer for now (transfer to Litial multisig post-launch)
  const TREASURY = deployer.address;
  const FOUNDATION = deployer.address;

  // Deploy PromotionAuction
  console.log("\nDeploying PromotionAuction...");
  const PromotionAuction = await ethers.getContractFactory("PromotionAuction");
  const promotionAuction = await PromotionAuction.deploy(SMESH_TOKEN, AGENT_REGISTRY, TREASURY, FOUNDATION);
  await promotionAuction.waitForDeployment();
  const promotionAuctionAddr = await promotionAuction.getAddress();
  console.log("PromotionAuction deployed to:", promotionAuctionAddr);

  // Deploy Spotlight
  console.log("\nDeploying Spotlight...");
  const Spotlight = await ethers.getContractFactory("Spotlight");
  const spotlight = await Spotlight.deploy(SMESH_TOKEN, AGENT_REGISTRY, TREASURY, FOUNDATION);
  await spotlight.waitForDeployment();
  const spotlightAddr = await spotlight.getAddress();
  console.log("Spotlight deployed to:", spotlightAddr);

  // Deploy Tipping
  console.log("\nDeploying Tipping...");
  const Tipping = await ethers.getContractFactory("Tipping");
  const tipping = await Tipping.deploy(SMESH_TOKEN, AGENT_REGISTRY, TREASURY);
  await tipping.waitForDeployment();
  const tippingAddr = await tipping.getAddress();
  console.log("Tipping deployed to:", tippingAddr);

  // Set roles on SMESHToken
  console.log("\nSetting roles on SMESHToken...");
  const smeshToken = await ethers.getContractAt("SMESHToken", SMESH_TOKEN);
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  await (await smeshToken.grantRole(MINTER_ROLE, AGENT_REGISTRY)).wait();
  console.log("MINTER_ROLE granted to AgentRegistry");
  await (await smeshToken.grantRole(BURNER_ROLE, ESCROW)).wait();
  console.log("BURNER_ROLE granted to Escrow");
  await (await smeshToken.grantRole(BURNER_ROLE, promotionAuctionAddr)).wait();
  console.log("BURNER_ROLE granted to PromotionAuction");

  console.log("\n========================================");
  console.log("🚀 SMESH FULLY DEPLOYED ON BASE MAINNET");
  console.log("========================================");
  console.log("SMESHToken:       ", SMESH_TOKEN);
  console.log("TokenVesting:     ", TOKEN_VESTING);
  console.log("AgentRegistry:    ", AGENT_REGISTRY);
  console.log("Escrow:           ", ESCROW);
  console.log("PromotionAuction: ", promotionAuctionAddr);
  console.log("Spotlight:        ", spotlightAddr);
  console.log("Tipping:          ", tippingAddr);
  console.log("========================================");
  console.log("\nBasescan:");
  console.log("https://basescan.org/address/" + SMESH_TOKEN);
}

main().catch((e) => { console.error(e); process.exit(1); });
