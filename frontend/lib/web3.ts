import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  type Eip1193Provider,
  type JsonRpcSigner,
} from "ethers";

// ─── Contract Addresses ───────────────────────────────────────────────────────
export const SMESH_ADDRESS  = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
export const REGISTRY_ADDRESS = "0x55684533a539eC77099A13ceD3C0B8665Cd0302b";
export const ESCROW_ADDRESS  = "0xC3B166c29A26DbD9Ba065Fb1a72e724Fc3105E6F";
export const TIPPING_ADDRESS = "0x1e1c8B9d5dE657d9285a99d5C92729fE3ef4f302";
export const BASE_CHAIN_ID   = 8453;

// Legacy export aliases
export const TOKEN_ADDRESS = SMESH_ADDRESS;
export const CHAIN_ID = BASE_CHAIN_ID;

// ─── ABIs ─────────────────────────────────────────────────────────────────────
export const SMESH_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const REGISTRY_ABI = [
  "function registerAgent(string name, string description, string apiEndpoint, string category, uint256 pricePerTask) returns (bytes32)",
  "function listingFee() view returns (uint256)",
  "function ecosystemReward() view returns (uint256)",
  "function nextAgentId() view returns (uint256)",
  "function getAgent(bytes32 agentId) view returns (bytes32 id, address owner, string name, string description, string apiEndpoint, string category, uint256 pricePerTask, bool active, uint256 completedTasks, uint256 rating)",
  "event AgentRegistered(bytes32 indexed agentId, address indexed owner, string name, uint256 reward)",
];

export const TIPPING_ABI = [
  "function tip(uint256 agentId, uint256 amount, string calldata message) external",
  "function totalTipsReceived(uint256 agentId) view returns (uint256)",
  "event TipSent(address indexed from, uint256 indexed agentId, uint256 amount, uint256 netAmount, string message)",
];

export const ESCROW_ABI = [
  "function hold(uint256 taskId, address payer, address agentOwner, uint256 agentId, uint256 amount) external",
  "function getEscrow(uint256 taskId) view returns (tuple(uint256 taskId, address payer, address agentOwner, uint256 agentId, uint256 amount, uint8 status))",
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgentEnrollData {
  name: string;
  description: string;
  apiEndpoint: string;
  category: string;
  pricePerTask: number; // in SMESH
  // Legacy fields kept for backward compat
  capabilities?: string[];
  metadataURI?: string;
}

/** @deprecated Use AgentEnrollData */
export type AgentData = AgentEnrollData;

export interface WalletState {
  address: string;
  smeshBalance: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getEthereum() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: unknown }).ethereum ?? null;
}

export function getProvider(): BrowserProvider {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("MetaMask not found. Please install MetaMask.");
  return new BrowserProvider(ethereum as Eip1193Provider);
}

export async function getSigner(): Promise<JsonRpcSigner> {
  return getProvider().getSigner();
}

/** Switch to Base Mainnet if not already on it */
async function ensureBaseNetwork(provider: BrowserProvider) {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: `0x${BASE_CHAIN_ID.toString(16)}` },
      ]);
    } catch (switchErr: unknown) {
      const err = switchErr as { code?: number };
      if (err.code === 4902) {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
            chainName: "Base Mainnet",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          },
        ]);
      } else {
        throw switchErr;
      }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Connect MetaMask and switch to Base Mainnet.
 * Returns WalletState { address, smeshBalance }.
 */
export async function connectWallet(): Promise<WalletState> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("MetaMask not found. Please install MetaMask.");

  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  await ensureBaseNetwork(provider);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const smeshBalance = await getSMESHBalance(address);

  return { address, smeshBalance };
}

/** Returns formatted SMESH balance (no decimal). */
export async function getSMESHBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const token = new Contract(SMESH_ADDRESS, SMESH_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(address) as Promise<bigint>,
      token.decimals() as Promise<number>,
    ]);
    return formatUnits(balance, decimals);
  } catch {
    return "0";
  }
}

/** Returns the current listing fee as a formatted SMESH string (e.g. "500"). */
export async function getListingFee(): Promise<string> {
  try {
    const provider = getProvider();
    const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const fee = await registry.listingFee() as bigint;
    return formatUnits(fee, 18);
  } catch {
    return "500";
  }
}

/** Returns the current ecosystem reward as a formatted SMESH string. */
export async function getEcosystemReward(): Promise<string> {
  try {
    const provider = getProvider();
    const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const reward = await registry.ecosystemReward() as bigint;
    return formatUnits(reward, 18);
  } catch {
    return "1000";
  }
}

/**
 * Approve the AgentRegistry to spend SMESH on behalf of the connected wallet.
 * Returns tx hash.
 */
export async function approveRegistry(amount: bigint): Promise<string> {
  const signer = await getSigner();
  const token = new Contract(SMESH_ADDRESS, SMESH_ABI, signer);
  const tx = await token.approve(REGISTRY_ADDRESS, amount);
  return tx.hash as string;
}

/**
 * Approve the Tipping contract to spend SMESH.
 * Returns tx hash.
 */
export async function approveTipping(amount: bigint): Promise<string> {
  const signer = await getSigner();
  const token = new Contract(SMESH_ADDRESS, SMESH_ABI, signer);
  const tx = await token.approve(TIPPING_ADDRESS, amount);
  return tx.hash as string;
}

/**
 * Approve the Escrow contract to spend SMESH.
 * Returns tx hash.
 */
export async function approveEscrow(amount: bigint): Promise<string> {
  const signer = await getSigner();
  const token = new Contract(SMESH_ADDRESS, SMESH_ABI, signer);
  const tx = await token.approve(ESCROW_ADDRESS, amount);
  return tx.hash as string;
}

/**
 * Check current SMESH allowance for a spender.
 */
export async function getAllowance(owner: string, spender: string): Promise<bigint> {
  const provider = getProvider();
  const token = new Contract(SMESH_ADDRESS, SMESH_ABI, provider);
  return token.allowance(owner, spender) as Promise<bigint>;
}

/**
 * Enroll an agent on-chain via AgentRegistry v2.
 * Handles: approve → registerAgent → parse agentId from event.
 *
 * Note: Assumes caller has already approved the listing fee OR passes
 * skipApproval=true if approval was done in a prior step.
 */
export async function enrollAgent(
  data: AgentEnrollData,
  skipApproval = false
): Promise<{ txHash: string; agentId: string }> {
  const signer = await getSigner();
  const signerAddress = await signer.getAddress();

  // Check allowance — auto-approve if insufficient
  if (!skipApproval) {
    const feeWei = parseUnits("500", 18);
    const allowance = await getAllowance(signerAddress, REGISTRY_ADDRESS);
    if (allowance < feeWei) {
      const approveTx = await (new Contract(SMESH_ADDRESS, SMESH_ABI, signer)).approve(
        REGISTRY_ADDRESS,
        feeWei
      );
      await approveTx.wait();
    }
  }

  const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

  const tx = await registry.registerAgent(
    data.name,
    data.description ?? "",
    data.apiEndpoint,
    data.category ?? "General",
    parseUnits(String(data.pricePerTask ?? 0), 18)
  );

  const receipt = await tx.wait();

  // Parse agentId from AgentRegistered event
  let agentId = "";
  if (receipt?.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = registry.interface.parseLog(log);
        if (parsed?.name === "AgentRegistered") {
          agentId = parsed.args.agentId as string;
          break;
        }
      } catch {
        // Not this event
      }
    }
  }

  return { txHash: tx.hash as string, agentId };
}

/**
 * Tip an agent via the Tipping contract.
 * @param agentId   On-chain uint256 agent ID (as number or string)
 * @param amountSMESH   Amount in SMESH (not wei)
 * @param message   Optional message (max 140 chars)
 * Returns tx hash.
 */
export async function tipAgent(
  agentId: number | string,
  amountSMESH: number,
  message = ""
): Promise<string> {
  const signer = await getSigner();
  const signerAddress = await signer.getAddress();

  const amountWei = parseUnits(String(amountSMESH), 18);

  // Approve if needed
  const allowance = await getAllowance(signerAddress, TIPPING_ADDRESS);
  if (allowance < amountWei) {
    const token = new Contract(SMESH_ADDRESS, SMESH_ABI, signer);
    const approveTx = await token.approve(TIPPING_ADDRESS, amountWei);
    await approveTx.wait();
  }

  const tipping = new Contract(TIPPING_ADDRESS, TIPPING_ABI, signer);
  const tx = await tipping.tip(agentId, amountWei, message.slice(0, 140));
  return tx.hash as string;
}

/**
 * Create a task by approving SMESH to Escrow and posting to the backend.
 * The actual on-chain escrow.hold() is called by the backend (owner-only).
 * Returns tx hash of the approval.
 */
export async function createTask(
  agentId: string,
  rewardSMESH: number,
  description: string
): Promise<string> {
  const signer = await getSigner();
  const signerAddress = await signer.getAddress();
  const rewardWei = parseUnits(String(rewardSMESH), 18);

  // Approve Escrow to pull payment when backend calls hold()
  const allowance = await getAllowance(signerAddress, ESCROW_ADDRESS);
  if (allowance < rewardWei) {
    const token = new Contract(SMESH_ADDRESS, SMESH_ABI, signer);
    const tx = await token.approve(ESCROW_ADDRESS, rewardWei);
    await tx.wait();
    return tx.hash as string;
  }

  // Already approved — return a placeholder hash
  return "0x_already_approved";
}

/** Returns true if MetaMask is available in the browser. */
export function isMetaMaskAvailable(): boolean {
  return !!getEthereum();
}
