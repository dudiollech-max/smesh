import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy SMESHToken
  const SMESHToken = await ethers.getContractFactory("SMESHToken");
  const smeshToken = await SMESHToken.deploy(deployer.address);
  await smeshToken.waitForDeployment();
  const smeshAddress = await smeshToken.getAddress();
  console.log("SMESHToken deployed to:", smeshAddress);

  // Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(smeshAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("AgentRegistry deployed to:", registryAddress);

  // Deploy PromotionAuction
  const PromotionAuction = await ethers.getContractFactory("PromotionAuction");
  const auction = await PromotionAuction.deploy(
    smeshAddress,
    registryAddress,
    deployer.address, // platform treasury
    deployer.address  // foundation (same for dev)
  );
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("PromotionAuction deployed to:", auctionAddress);

  // Deploy Escrow
  const EscrowContract = await ethers.getContractFactory("Escrow");
  const escrow = await EscrowContract.deploy(smeshAddress, registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed to:", escrowAddress);

  // Deploy Spotlight
  const SpotlightContract = await ethers.getContractFactory("Spotlight");
  const spotlight = await SpotlightContract.deploy(
    smeshAddress,
    registryAddress,
    deployer.address, // platform treasury
    deployer.address  // foundation (same for dev)
  );
  await spotlight.waitForDeployment();
  const spotlightAddress = await spotlight.getAddress();
  console.log("Spotlight deployed to:", spotlightAddress);

  // Deploy Tipping
  const TippingContract = await ethers.getContractFactory("Tipping");
  const tipping = await TippingContract.deploy(
    smeshAddress,
    registryAddress,
    deployer.address // platform treasury
  );
  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();
  console.log("Tipping deployed to:", tippingAddress);

  // Grant BURNER_ROLE to Escrow, PromotionAuction, Spotlight, and Tipping
  const BURNER_ROLE = await smeshToken.BURNER_ROLE();
  await smeshToken.grantRole(BURNER_ROLE, escrowAddress);
  await smeshToken.grantRole(BURNER_ROLE, auctionAddress);
  await smeshToken.grantRole(BURNER_ROLE, spotlightAddress);
  await smeshToken.grantRole(BURNER_ROLE, tippingAddress);
  console.log("BURNER_ROLE granted to Escrow, PromotionAuction, Spotlight, and Tipping");

  // Grant MINTER_ROLE to AgentRegistry (for reward minting)
  const MINTER_ROLE = await smeshToken.MINTER_ROLE();
  await smeshToken.grantRole(MINTER_ROLE, registryAddress);
  console.log("MINTER_ROLE granted to AgentRegistry");

  console.log("\n--- Deployment Summary ---");
  console.log("SMESHToken:       ", smeshAddress);
  console.log("AgentRegistry:    ", registryAddress);
  console.log("PromotionAuction: ", auctionAddress);
  console.log("Escrow:           ", escrowAddress);
  console.log("Spotlight:        ", spotlightAddress);
  console.log("Tipping:          ", tippingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
