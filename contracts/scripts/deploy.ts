import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // ─── Deploy SMESHToken ───────────────────────────────────────────────────────
  const SMESHToken = await ethers.getContractFactory("SMESHToken");
  const smeshToken = await SMESHToken.deploy(deployer.address);
  await smeshToken.waitForDeployment();
  const smeshAddress = await smeshToken.getAddress();
  console.log("SMESHToken deployed to:", smeshAddress);

  // ─── Deploy TokenVesting ─────────────────────────────────────────────────────
  // Owner is deployer initially; transfer to Foundation multisig post-deployment.
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy(smeshAddress, deployer.address);
  await tokenVesting.waitForDeployment();
  const vestingAddress = await tokenVesting.getAddress();
  console.log("TokenVesting deployed to:", vestingAddress);

  // Transfer 200M SMESH to the vesting contract (team & advisor allocation)
  const TEAM_ALLOCATION = ethers.parseEther("200000000"); // 200M tokens
  await smeshToken.transfer(vestingAddress, TEAM_ALLOCATION);
  console.log("Transferred 200,000,000 SMESH to TokenVesting contract");

  // ─── Deploy AgentRegistry ────────────────────────────────────────────────────
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(smeshAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("AgentRegistry deployed to:", registryAddress);

  // ─── Deploy PromotionAuction ─────────────────────────────────────────────────
  const PromotionAuction = await ethers.getContractFactory("PromotionAuction");
  const auction = await PromotionAuction.deploy(
    smeshAddress,
    registryAddress,
    deployer.address, // platform treasury
    deployer.address  // foundation (same for dev; replace with multisig on mainnet)
  );
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("PromotionAuction deployed to:", auctionAddress);

  // ─── Deploy Escrow ───────────────────────────────────────────────────────────
  const EscrowContract = await ethers.getContractFactory("Escrow");
  const escrow = await EscrowContract.deploy(smeshAddress, registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed to:", escrowAddress);

  // ─── Deploy Spotlight ────────────────────────────────────────────────────────
  const SpotlightContract = await ethers.getContractFactory("Spotlight");
  const spotlight = await SpotlightContract.deploy(
    smeshAddress,
    registryAddress,
    deployer.address, // platform treasury
    deployer.address  // foundation (same for dev; replace with multisig on mainnet)
  );
  await spotlight.waitForDeployment();
  const spotlightAddress = await spotlight.getAddress();
  console.log("Spotlight deployed to:", spotlightAddress);

  // ─── Deploy Tipping ──────────────────────────────────────────────────────────
  const TippingContract = await ethers.getContractFactory("Tipping");
  const tipping = await TippingContract.deploy(
    smeshAddress,
    registryAddress,
    deployer.address // platform treasury
  );
  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();
  console.log("Tipping deployed to:", tippingAddress);

  // ─── Grant roles ─────────────────────────────────────────────────────────────

  // BURNER_ROLE → protocol contracts that need to burn tokens
  const BURNER_ROLE = await smeshToken.BURNER_ROLE();
  await smeshToken.grantRole(BURNER_ROLE, escrowAddress);
  await smeshToken.grantRole(BURNER_ROLE, auctionAddress);
  await smeshToken.grantRole(BURNER_ROLE, spotlightAddress);
  await smeshToken.grantRole(BURNER_ROLE, tippingAddress);
  console.log("BURNER_ROLE granted to Escrow, PromotionAuction, Spotlight, and Tipping");

  // MINTER_ROLE → AgentRegistry (for reward minting)
  const MINTER_ROLE = await smeshToken.MINTER_ROLE();
  await smeshToken.grantRole(MINTER_ROLE, registryAddress);
  console.log("MINTER_ROLE granted to AgentRegistry");

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                  DEPLOYMENT SUMMARY                         ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║ SMESHToken:        ", smeshAddress.padEnd(45), "║");
  console.log("║ TokenVesting:      ", vestingAddress.padEnd(45), "║");
  console.log("║ AgentRegistry:     ", registryAddress.padEnd(45), "║");
  console.log("║ PromotionAuction:  ", auctionAddress.padEnd(45), "║");
  console.log("║ Escrow:            ", escrowAddress.padEnd(45), "║");
  console.log("║ Spotlight:         ", spotlightAddress.padEnd(45), "║");
  console.log("║ Tipping:           ", tippingAddress.padEnd(45), "║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  console.log("\n⚠️  POST-DEPLOYMENT ACTIONS (mainnet only):");
  console.log("   1. Transfer TokenVesting ownership to Foundation multisig:");
  console.log("      tokenVesting.transferOwnership(FOUNDATION_MULTISIG)");
  console.log("   2. Transfer SMESHToken DEFAULT_ADMIN_ROLE to Foundation multisig");
  console.log("   3. Revoke deployer's roles from SMESHToken");
  console.log("   4. Create individual vesting schedules for team members via multisig");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
