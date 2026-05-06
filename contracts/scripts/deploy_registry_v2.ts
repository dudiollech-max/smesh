import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const SMESH_TOKEN    = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const LITIAL_TREASURY = "0x715Eec1f3451aBd35bb0D2ac17d85086BC175A31";
const ECOSYSTEM_WALLET = "0x280d5A5C052AD64C4f72f58f694C33beD29E175E";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying AgentRegistry v2");
  console.log("   Deployer:", deployer.address);
  console.log("   SMESH Token:", SMESH_TOKEN);
  console.log("   Litial Treasury:", LITIAL_TREASURY);
  console.log("   Ecosystem Wallet:", ECOSYSTEM_WALLET);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   ETH balance:", ethers.formatEther(balance), "ETH\n");

  // ─── Deploy AgentRegistry v2 ──────────────────────────────────────────────
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  console.log("Deploying AgentRegistry v2...");

  const registry = await AgentRegistry.deploy(
    SMESH_TOKEN,
    LITIAL_TREASURY,
    ECOSYSTEM_WALLET
  );
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ AgentRegistry v2 deployed:", registryAddress);

  // ─── Grant BURNER_ROLE to new registry ────────────────────────────────────
  console.log("\nGranting BURNER_ROLE to new registry...");

  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const smeshABI = [
    "function grantRole(bytes32 role, address account) external",
    "function hasRole(bytes32 role, address account) view returns (bool)",
  ];
  const smesh = new ethers.Contract(SMESH_TOKEN, smeshABI, deployer);

  const alreadyHasRole = await smesh.hasRole(BURNER_ROLE, registryAddress);
  if (!alreadyHasRole) {
    const tx = await smesh.grantRole(BURNER_ROLE, registryAddress);
    await tx.wait();
    console.log("✅ BURNER_ROLE granted. tx:", tx.hash);
  } else {
    console.log("ℹ️  Already has BURNER_ROLE");
  }

  // ─── Verify economics params ──────────────────────────────────────────────
  const listingFee = await (registry as unknown as { listingFee(): Promise<bigint> }).listingFee();
  const ecosystemReward = await (registry as unknown as { ecosystemReward(): Promise<bigint> }).ecosystemReward();
  const burnPct = await (registry as unknown as { burnPercent(): Promise<bigint> }).burnPercent();

  console.log("\n📊 Economics configuration:");
  console.log("   Listing fee:", ethers.formatEther(listingFee), "SMESH");
  console.log("   Ecosystem reward:", ethers.formatEther(ecosystemReward), "SMESH");
  console.log("   Burn percent:", burnPct.toString() + "%");

  // ─── Update deployments JSON ──────────────────────────────────────────────
  const deploymentsPath = path.join(__dirname, "../deployments/base-mainnet.json");
  let deployments: Record<string, unknown> = {};
  try {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  } catch {
    deployments = {};
  }

  // Archive old address
  (deployments as Record<string, unknown>).contracts = {
    ...(deployments.contracts as object),
    AgentRegistry_v1: (deployments.contracts as Record<string, string>)?.AgentRegistry ?? "0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF",
    AgentRegistry: registryAddress,
  };
  (deployments as Record<string, unknown>).lastDeployedAt = new Date().toISOString();

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("\n✅ Saved to deployments/base-mainnet.json");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("✅ AgentRegistry v2 LIVE on Base Mainnet");
  console.log("=".repeat(60));
  console.log("Address:     ", registryAddress);
  console.log("Basescan:    ", `https://basescan.org/address/${registryAddress}`);
  console.log("\n⚠️  NEXT STEP: Ecosystem wallet approval needed!");
  console.log("   See docs/ECOSYSTEM_APPROVAL_STEPS.md for instructions.");
  console.log("   Dave must approve the registry to spend 300M SMESH");
  console.log("   from ecosystem wallet:", ECOSYSTEM_WALLET);
  console.log("=".repeat(60) + "\n");

  // Output for easy copy
  console.log(`REGISTRY_ADDRESS=${registryAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
