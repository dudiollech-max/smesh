# SMESH — Project Status & Roadmap
**Updated:** May 5, 2026 | **Entity:** Litial Consulting FZ LLC (UAE)

---

## ✅ DONE — What's Live Right Now

### Platform
| Item | Status | URL |
|------|--------|-----|
| Frontend | Live on Vercel | https://smesh-frontend.vercel.app |
| Tokenomics page | Live | https://smesh-frontend.vercel.app/tokenomics |
| Legal / ToS | Live | https://smesh-frontend.vercel.app/legal/terms |
| GitHub repo | Public | https://github.com/dudiollech-max/smesh |
| Backend | Pending Railway deploy | — |

### Smart Contracts — Base Mainnet ✅
| Contract | Address |
|----------|---------|
| SMESHToken | `0xDA31b578841d6d4417Dba55EFbdbF068e101a67a` |
| TokenVesting | `0xd0ac3e32cC215c793f3BCE61d05157AdA380AED6` |
| AgentRegistry | `0xD66E19fEED8ffe06F25E41FcCc4C068528569EaF` |
| Escrow | `0xC3B166c29A26DbD9Ba065Fb1a72e724Fc3105E6F` |
| PromotionAuction | `0x191d931eeC1860EDFe4445a8E3e5D289BE4A207A` |
| Spotlight | `0xFdC1097c93eBC75d04041A0E9A56e8e35D41fDe2` |
| Tipping | `0x1e1c8B9d5dE657d9285a99d5C92729fE3ef4f302` |

🔍 Basescan: https://basescan.org/address/0xDA31b578841d6d4417Dba55EFbdbF068e101a67a

### Token Distribution — 1,000,000,000 SMESH ✅
| Wallet | Address | SMESH | % |
|--------|---------|-------|---|
| Foundation | `0x715Eec1f3451aBd35bb0D2ac17d85086BC175A31` | 200,000,000 | 20% |
| Ecosystem | `0x280d5A5C052AD64C4f72f58f694C33beD29E175E` | 300,000,000 | 30% |
| Team (vesting) | `0xBd7d1f340fb6f24E1B8bEe442ba096c47AEA998B` | 200,000,000 | 20% |
| Deployer / Reserve | `0xA03EAa3EE2E6785272E06427afD58a59D61DEEDa` | 300,000,000 | 30% |
| **Total** | | **1,000,000,000** | **100%** |

> Team allocation is locked in `TokenVesting` contract — 4yr vest, 1yr cliff (unlocks May 2027)

### Legal & Entity
- ✅ Litial Consulting FZ LLC (UAE) — live, has bank account
- ✅ Terms of Service + Token Disclaimer — published
- ✅ Utility token framing — SMESH is not a security

### Documents Ready
- ✅ `WALLET_STRUCTURE.md` — Gnosis Safe setup guide
- ✅ `COINGECKO_SUBMISSION.md` — listing template (contract address filled)
- ✅ `SHERLOCK_SUBMISSION.md` — audit contest package
- ✅ Investor deck v2 — `smesh-investor-deck-v2.pptx`

---

## ⏳ NEXT — Immediate Actions (This Week)

### 1. Aerodrome Liquidity Pool — MAKES TOKEN TRADEABLE
**What:** Create SMESH/USDC pool on Aerodrome (Base's main DEX)
**Target:** $5M FDV market cap → price = $0.005/SMESH
**You need:**
- $500 USDC withdrawn from Binance → Base network
- 100,000 SMESH from deployer wallet `0xA03E...EEDa`

**Steps:**
1. Withdraw $500 USDC from Binance → Base network to your wallet
2. Go to https://aerodrome.finance
3. Create SMESH/USDC pool at 0.005 ratio
4. Sully handles the SMESH side

**Cost:** $500 USDC (you own it as LP tokens — recoverable)

---

### 2. CoinGecko + CoinMarketCap Listing
**What:** Get SMESH listed on both price trackers
**Cost:** Free
**Who:** Sully submits once Aerodrome pool is live
**Timeline:** 1–2 weeks after pool creation

---

### 3. Railway Backend Deployment
**What:** Deploy the Smesh backend API to Railway
**Cost:** Free tier
**Who:** Sully handles — needs Railway login
**Status:** Blocked (Railway auth code expired)

---

### 4. Gnosis Safe Multisig (Security Upgrade)
**What:** Move Foundation + Treasury allocations to 2-of-3 multisig wallets
**Why:** Single MetaMask = single point of failure. Multisig = much safer.
**Cost:** Free (small gas)
**Who:** Dave sets up wallets at app.safe.global, Sully transfers
**Priority:** Medium — do before any public announcement

---

### 5. Sherlock Audit Submission
**What:** Submit contracts for free security audit via Sherlock contest
**Cost:** Free
**Who:** Sully submits
**Timeline:** Can submit now — audit takes 2–4 weeks

---

## 🔜 PHASE 2 — After Token Is Tradeable (Month 2)

| Item | Description | Cost |
|------|-------------|------|
| Domain | smesh.ai or smeshfoundation.org | ~$15/yr |
| Token sale page | Simple buy page for Public Sale allocation (150M tokens) | Sully builds |
| Marketing | Twitter/X presence, Discord community | Dave leads |
| KOL campaign | Crypto influencer outreach (Lunar Strategy or similar) | $5k–20k |
| CEX listing | Bybit, Gate, KuCoin outreach | Free to apply |
| Market maker | Kairon Labs or similar | $10k–50k |
| Contract audit (formal) | OpenZeppelin — needed for major CEX | $5k–15k |
| Ownership transfer | Transfer contract admin to Litial multisig | ~$5 gas |

---

## 💰 COST SUMMARY

### Already Spent
| Item | Cost |
|------|------|
| ETH for gas (contracts + distributions) | ~$5 |
| Vercel / Railway hosting | $0 |
| **Total spent** | **~$5** |

### Still Required
| Item | Cost |
|------|------|
| Aerodrome seed liquidity | $500 USDC (recoverable) |
| CoinGecko / CMC listing | $0 |
| Sherlock audit | $0 |
| **Minimum to launch** | **$500** |

---

## 🔑 Key Info

| Item | Detail |
|------|--------|
| Token name | Smesh Token |
| Symbol | SMESH |
| Total supply | 1,000,000,000 |
| Chain | Base Mainnet (Chain ID: 8453) |
| Token contract | `0xDA31b578841d6d4417Dba55EFbdbF068e101a67a` |
| Target launch price | $0.005 |
| Target FDV at launch | $5,000,000 |
| Entity | Litial Consulting FZ LLC (UAE) |
| Frontend | https://smesh-frontend.vercel.app |
| GitHub | https://github.com/dudiollech-max/smesh |
| Deployer wallet | `0x51d81F7eed2ee61FFd27eC230A4663A538e404Ae` (empty, retired) |

---

## ⚠️ RISKS / WATCH LIST

| Risk | Mitigation |
|------|-----------|
| MetaMask single point of failure | Upgrade Foundation + Treasury to Gnosis Safe |
| No formal audit yet | Sherlock free audit in progress; avoid marketing until done |
| Backend not deployed | Railway deploy pending |
| Contract ownership still with deployer wallet | Transfer to Litial multisig before public launch |
| No custom domain | Register smesh.ai or smeshfoundation.org |
