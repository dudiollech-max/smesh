# CoinGecko Self-Service Listing — Smesh (SMESH)

**Submission Type:** New Token / Self-Service  
**Prepared:** May 2026  
**Status:** Draft — fill in TBD fields after mainnet deployment

---

## Section 1: Project Information

| Field | Value |
|-------|-------|
| **Project Name** | Smesh |
| **Token Name** | Smesh Token |
| **Token Symbol** | SMESH |
| **Token Decimals** | 18 |
| **Token Type** | ERC-20 |
| **Blockchain** | Base (Ethereum L2) |
| **Contract Address** | **TBD** — publish after mainnet deployment |
| **Total Supply** | 1,000,000,000 SMESH |
| **Circulating Supply at Launch** | TBD (approximate: ~300M — Ecosystem allocation minus locked portions) |
| **Maximum Supply** | 1,000,000,000 SMESH (fixed; burn reduces effective supply over time) |

---

## Section 2: Project Description

**Short Description (≤ 200 chars):**
> Smesh is a decentralised AI agent marketplace on Base. SMESH is the utility token enabling agent payments, governance, and protocol participation.

**Long Description:**
> Smesh is a decentralised utility marketplace where AI agents are discovered, hired, and orchestrated in real time. The platform enables AI agent operators to register their agents, accept tasks from users, and earn SMESH tokens as compensation. Task requesters pay in SMESH, with 85% going to the agent owner, 10% to the platform treasury, and 5% permanently burned to create deflationary tokenomics.
>
> SMESH is the native utility token of the Smesh ecosystem. It is used for:
> - Paying for AI agent services (primary utility)
> - Spotlight auction bids (agent promotion)
> - Tipping top-performing agents
> - Governance participation (Foundation multisig-controlled)
>
> The platform is built on Base (Ethereum L2) using smart contracts audited via the Sherlock security contest programme. The Foundation is incorporated in the United Arab Emirates.

---

## Section 3: Website & Social Links

| Field | Value |
|-------|-------|
| **Official Website** | https://smesh.xyz |
| **Whitepaper / Docs** | https://smesh.xyz/docs (TBD) |
| **GitHub** | https://github.com/smesh-xyz (TBD) |
| **Twitter / X** | https://x.com/smesh_xyz (TBD) |
| **Telegram** | https://t.me/smesh_community (TBD) |
| **Discord** | https://discord.gg/smesh (TBD) |
| **Blog / Medium** | TBD |
| **LinkedIn** | TBD |

---

## Section 4: Token Contract Details

| Field | Value |
|-------|-------|
| **Network** | Base Mainnet (Chain ID: 8453) |
| **Contract Address** | **[TBD — insert after deployment]** |
| **Token Standard** | ERC-20 |
| **Verified on Explorer** | Yes (to be verified on Basescan post-deployment) |
| **Basescan URL** | https://basescan.org/token/[TBD] |
| **OpenZeppelin Contracts** | Yes (v5.x) |
| **Proxy** | No (non-upgradeable) |
| **Mint Function** | Yes — restricted to MINTER_ROLE (AgentRegistry rewards only) |
| **Burn Function** | Yes — 5% burn on transfers via platform contracts |

---

## Section 5: Exchanges & Liquidity

| Field | Value |
|-------|-------|
| **Primary DEX** | Aerodrome Finance (Base) |
| **Trading Pair** | SMESH/WETH |
| **Pool URL** | **[TBD — insert Aerodrome pool link after liquidity deployed]** |
| **Initial Liquidity Provider** | Litial Consulting FZ LLC (Market Maker allocation: 50M SMESH) |
| **CEX Listings** | None at launch; targeting Tier-2 CEX post- |
| **Uniswap V3 (Base)** | Possible secondary pool (TBD) |

---

## Section 6: Token Distribution

| Allocation | % | Tokens | Notes |
|-----------|---|--------|-------|
| Ecosystem & Rewards | 30% | 300,000,000 | Protocol-distributed; 2-of-3 multisig |
| Team & Advisors | 20% | 200,000,000 | 4yr vest, 1yr cliff — TokenVesting.sol |
| Foundation Reserve | 20% | 200,000,000 | 3-of-5 governance multisig |
| Public Sale | 15% | 150,000,000 | Locked until offering approved |
| Treasury | 10% | 100,000,000 | Operations — 2-of-3 multisig |
| Market Maker | 5% | 50,000,000 | Locked 12 months post-TGE |

---

## Section 7: Vesting Schedule

| Allocation | Lock Type | Cliff | Duration |
|-----------|-----------|-------|---------|
| Team & Advisors | Linear vest | 12 months | 48 months |
| Market Maker | Hard lock | — | 12 months (full unlock) |
| Foundation Reserve | Governance multisig | N/A | No time-lock; governance controls |
| Public Sale | Hard lock | — | Until  approval |

---

## Section 8: Security & Audits

| Field | Value |
|-------|-------|
| **Audit Status** | Sherlock security contest — in progress |
| **Audit Firm(s)** | Sherlock (contest-based; results TBD) |
| **Audit Report URL** | TBD — will publish after contest |
| **Bug Bounty** | TBD — to be established post-audit |
| **OpenZeppelin Defender** | Yes (monitoring planned) |
| **Multisig** | Yes — all admin functions on 3-of-5 / 2-of-3 Gnosis Safes |

---

## Section 9: Team

| Field | Value |
|-------|-------|
| **Team Public** | Partially — advisors public; core dev pseudonymous |
| **Foundation Entity** | Litial Consulting FZ LLC |
| **KYC** | Litial Consulting FZ LLC directors KYC'd with legal counsel |

---

## Section 10: Logo & Assets

| Asset | Specification | Status |
|-------|--------------|--------|
| Token logo (200×200 PNG) | Transparent background | TBD |
| Token logo (512×512 PNG) | Transparent background | TBD |
| Project banner | 1400×400 PNG | TBD |
| Favicon | 32×32 PNG | TBD |

*All logos must meet CoinGecko's image guidelines: transparent background, no text in logo, clean edges.*

---

## Section 11: Supporting Evidence

CoinGecko typically requires the following evidence for approval. Prepare:

1. **On-chain activity:** Minimum 10 transactions after launch
2. **Liquidity proof:** Screenshot or link showing >$50,000 USD equivalent liquidity
3. **Community presence:** Twitter/X profile with activity, Telegram/Discord members
4. **Website live:** Official site with team/product information
5. **Code repository:** GitHub with verified contract code
6. **Basescan verification:** Contract must be verified on Basescan

---

## Submission Checklist

- [ ] Token deployed on Base mainnet
- [ ] Contract verified on Basescan
- [ ] Aerodrome liquidity pool created (≥$50k)
- [ ] Official website live at smesh.xyz
- [ ] Twitter/X profile active
- [ ] Telegram community active
- [ ] Token logo assets ready (200×200 and 512×512 PNG)
- [ ] Fill in all TBD fields in this document
- [ ] Submit at: https://www.coingecko.com/en/coins/add

---

*Note: CoinGecko also accepts submissions via their API for verified data providers. Once listed, update circulating supply data via their API or by maintaining a supply endpoint.*
