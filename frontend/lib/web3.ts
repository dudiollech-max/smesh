import { BrowserProvider, Contract, formatUnits, parseUnits, type Eip1193Provider } from "ethers";

// ─── Constants ────────────────────────────────────────────────────────────────
export const TOKEN_ADDRESS = "0xDA31b578841d6d4417Dba55EFbdbF068e101a67a";
export const REGISTRY_ADDRESS = "0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF";
export const ECOSYSTEM_WALLET = "0x280d5A5C052AD64C4f72f58f694C33beD29E175E";
export const CHAIN_ID = 8453; // Base Mainnet

// ─── ABIs (minimal) ───────────────────────────────────────────────────────────
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const REGISTRY_ABI = [
  "function registerAgent(string name, string apiEndpoint, string capabilitySchema, string metadataURI) returns (uint256)",
  "function nextAgentId() view returns (uint256)",
  "function REWARD_AMOUNT() view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, string apiEndpoint, string capabilitySchema, string metadataURI)",
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgentData {
  name: string;
  apiEndpoint: string;
  capabilities: string[];
  description?: string;
  metadataURI?: string;
}

export interface WalletState {
  address: string;
  smeshBalance: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detect if running in browser with MetaMask */
function getEthereum() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: unknown }).ethereum ?? null;
}

/** Get an ethers BrowserProvider */
function getProvider(): BrowserProvider {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("MetaMask not found. Please install MetaMask.");
  return new BrowserProvider(ethereum as Eip1193Provider);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Connects MetaMask and switches to Base Mainnet if needed.
 * Returns { address, smeshBalance }.
 */
export async function connectWallet(): Promise<WalletState> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("MetaMask not found. Please install MetaMask.");

  const provider = getProvider();

  // Request accounts
  await provider.send("eth_requestAccounts", []);

  // Switch to Base if not already on it
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: `0x${CHAIN_ID.toString(16)}` },
      ]);
    } catch (switchErr: unknown) {
      // Chain not added yet — add it
      const err = switchErr as { code?: number };
      if (err.code === 4902) {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: `0x${CHAIN_ID.toString(16)}`,
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

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const smeshBalance = await getSMESHBalance(address);

  return { address, smeshBalance };
}

/**
 * Returns the formatted SMESH balance for a given address.
 */
export async function getSMESHBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(address) as Promise<bigint>,
      token.decimals() as Promise<number>,
    ]);
    return formatUnits(balance, decimals);
  } catch {
    return "0";
  }
}

/**
 * Calls AgentRegistry.registerAgent() on-chain.
 * Returns the transaction hash.
 */
export async function enrollAgent(agentData: AgentData): Promise<string> {
  const provider = getProvider();
  const signer = await provider.getSigner();

  const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

  const capabilitySchema = JSON.stringify({ capabilities: agentData.capabilities });
  const metadataURI = agentData.metadataURI ?? "";

  const tx = await registry.registerAgent(
    agentData.name,
    agentData.apiEndpoint,
    capabilitySchema,
    metadataURI
  );

  return tx.hash as string;
}

/**
 * Approve SMESH spend for the registry contract (used internally).
 */
export async function approveRegistry(amount: string): Promise<string> {
  const provider = getProvider();
  const signer = await provider.getSigner();

  const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
  const tx = await token.approve(REGISTRY_ADDRESS, parseUnits(amount, 18));
  return tx.hash as string;
}

/** Returns true if MetaMask is available */
export function isMetaMaskAvailable(): boolean {
  return !!getEthereum();
}
