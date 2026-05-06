import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const SMESH_TOKEN = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
const NEW_REGISTRY = "0x55684533a539eC77099A13ceD3C0B8665Cd0302b";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Granting BURNER_ROLE...");
  console.log("Deployer:", deployer.address);

  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Current nonce:", nonce);

  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const smeshABI = [
    "function grantRole(bytes32 role, address account) external",
    "function hasRole(bytes32 role, address account) view returns (bool)",
  ];
  const smesh = new ethers.Contract(SMESH_TOKEN, smeshABI, deployer);

  const alreadyHasRole = await smesh.hasRole(BURNER_ROLE, NEW_REGISTRY);
  if (alreadyHasRole) {
    console.log("✅ Registry already has BURNER_ROLE");
    return;
  }

  const tx = await smesh.grantRole(BURNER_ROLE, NEW_REGISTRY, { nonce });
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ BURNER_ROLE granted to", NEW_REGISTRY);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
