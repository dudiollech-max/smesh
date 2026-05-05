# Smesh Token — Wallet Structure & Gnosis Safe Setup

**Network:** Base Mainnet (Chain ID: 8453)  
**Total Supply:** 1,000,000,000 SMESH

---

## Wallet Overview

| Wallet | Type | Allocation | Tokens | Notes |
|--------|------|-----------|--------|-------|
| Foundation Multisig | 3-of-5 Gnosis Safe | 20% | 200,000,000 SMESH | Governance-locked; Foundation Reserve |
| Ecosystem Multisig | 2-of-3 Gnosis Safe | 30% | 300,000,000 SMESH | Ecosystem rewards; distributed via protocol |
| Team Vesting Contract | TokenVesting.sol | 20% | 200,000,000 SMESH | 4-year vest, 1-year cliff; individual schedules |
| Treasury Multisig | 2-of-3 Gnosis Safe | 10% | 100,000,000 SMESH | Operations & partnerships; multisig governed |
| Public Sale Wallet | EOA / Reg A+ | 15% | 150,000,000 SMESH | Locked until Reg A+ offering approved |
| Market Maker Wallet | Smart contract lock | 5% | 50,000,000 SMESH | Locked 12 months post-TGE |

---

## 1. Foundation Multisig (3-of-5)

**Purpose:** Holds the Foundation Reserve. Controls protocol upgrades, vesting revocations, and is the `owner()` of the TokenVesting contract.

**Allocation:** 200,000,000 SMESH (20%)

**Signers (recommended):**
- 3 Foundation board members (hardware wallets — Ledger/Trezor)
- 2 independent trustees (geographically distributed)

**Gnosis Safe setup:**
```
Threshold: 3-of-5
Network: Base
```

**Setup instructions:**
1. Go to [https://app.safe.global](https://app.safe.global)
2. Click **Create new Safe**
3. Select **Base** network
4. Add 5 owner addresses (hardware wallet addresses only)
5. Set threshold to **3**
6. Submit transaction and wait for Safe to deploy
7. Note the Safe address — this is your Foundation Multisig address
8. Transfer 200M SMESH here immediately post-deployment

**Post-deployment:**
- Transfer ownership of `TokenVesting.sol` to this address:
  `TokenVesting.transferOwnership(foundationMultisigAddress)`
- Grant `DEFAULT_ADMIN_ROLE` on `SMESHToken` to this address

---

## 2. Ecosystem Multisig (2-of-3)

**Purpose:** Manages Ecosystem & Rewards allocation. Tokens are distributed via protocol contracts (AgentRegistry rewards, task completion bonuses). This Safe approves large protocol reward tranches.

**Allocation:** 300,000,000 SMESH (30%)

**Signers (recommended):**
- 2 core protocol maintainers
- 1 Foundation board member

**Gnosis Safe setup:**
```
Threshold: 2-of-3
Network: Base
```

**Setup instructions:**
1. Repeat Safe creation at [https://app.safe.global](https://app.safe.global)
2. Select **Base** network
3. Add 3 owner addresses
4. Set threshold to **2**
5. Transfer 300M SMESH here post-deployment

**Notes:**
- Tokens are "unlocked" but access-controlled by this multisig
- Do NOT grant MINTER_ROLE to this Safe — all distributions are from existing allocation
- Use Zodiac Roles module if you need granular sub-permissions for protocol contracts

---

## 3. Team Vesting Contract (TokenVesting.sol)

**Purpose:** Time-locked allocation for team members and advisors. Each beneficiary has their own vesting schedule. Foundation Multisig is the owner and can revoke schedules.

**Allocation:** 200,000,000 SMESH (20%)

**Vesting terms (standard team):**
- Cliff: 12 months (365 days)
- Total duration: 48 months (4 × 365 days = 1,460 days)
- Linear vesting after cliff
- Revocable by Foundation Multisig

**Post-deployment steps:**
1. Deploy `TokenVesting.sol` with `(smeshTokenAddress, foundationMultisigAddress)`
2. Transfer 200M SMESH to the `TokenVesting` contract
3. For each team member, call `createTeamVestingSchedule(beneficiary, amount)` via Foundation Safe
4. Advisors may use `createVestingSchedule()` with custom parameters

**Example allocation breakdown (suggested):**
| Role | Allocation | Beneficiaries |
|------|-----------|---------------|
| Core team | 140M SMESH | ~5–10 members |
| Advisors | 40M SMESH | ~5–8 advisors |
| Future hires reserve | 20M SMESH | Held in contract |

---

## 4. Treasury Multisig (2-of-3)

**Purpose:** Operational treasury for partnerships, listings, legal costs, marketing, and protocol development grants.

**Allocation:** 100,000,000 SMESH (10%)

**Signers (recommended):**
- CEO / Operations lead
- CFO / Finance lead
- 1 Foundation board member

**Gnosis Safe setup:**
```
Threshold: 2-of-3
Network: Base
```

**Setup instructions:**
1. Create Safe at [https://app.safe.global](https://app.safe.global)
2. Select **Base** network
3. Add 3 owner addresses
4. Set threshold to **2**
5. Transfer 100M SMESH here post-deployment

**Best practices:**
- Set spending limits via Gnosis Safe's Allowance module (e.g., 1M SMESH/week auto-approved)
- Use Zodiac for time-locks on large transactions (>10M SMESH)
- Quarterly reporting to Foundation on treasury usage

---

## 5. Public Sale Wallet

**Purpose:** Reserved for Regulation A+ public offering when regulatory approval obtained.

**Allocation:** 150,000,000 SMESH (15%)

**Status:** Locked until SEC/BVI approval for Reg A+ offering.

**Recommended structure:**
- Use a 2-of-3 Gnosis Safe controlled by Foundation + legal counsel
- Tokens should remain locked via a timelock contract until offering is approved
- Consider a Zodiac Delay module: 48-hour delay on all withdrawals

---

## 6. Market Maker Wallet

**Purpose:** Provide liquidity on Aerodrome (Base) DEX and maintain healthy trading conditions post-TGE.

**Allocation:** 50,000,000 SMESH (5%)

**Lock:** 12 months from Token Generation Event (TGE)

**Recommended implementation:**
- Deploy a simple TimeLock contract or use TokenVesting with a 12-month cliff, 12-month duration
- After unlock, transfer to a 2-of-3 multisig shared between Foundation + Market Maker firm

---

## General Gnosis Safe Tips for Base Network

1. **Always test on Base Sepolia first** — deploy the same Safe config on testnet before mainnet
2. **Hardware wallets required** — use Ledger or Trezor for all signers; never use hot wallets as signers
3. **Transaction simulation** — Gnosis Safe has built-in simulation; always simulate before executing
4. **Use Safe Apps** — the Safe UI at [app.safe.global](https://app.safe.global) supports batch transactions
5. **Backup** — store signer seeds in a geographically distributed manner; use Shamir's Secret Sharing for critical keys
6. **Timelock (optional)** — consider adding a Zodiac Delay module (24–48h delay) for large Safe transactions
7. **Notifications** — configure Safe transaction notifications via the Safe UI or third-party monitor (e.g., Tenderly)

---

## Post-Deployment Checklist

- [ ] Foundation Multisig deployed on Base
- [ ] Ecosystem Multisig deployed on Base
- [ ] Treasury Multisig deployed on Base
- [ ] TokenVesting contract deployed with Foundation Multisig as owner
- [ ] 200M SMESH transferred to Foundation Multisig
- [ ] 300M SMESH transferred to Ecosystem Multisig
- [ ] 200M SMESH transferred to TokenVesting contract
- [ ] 100M SMESH transferred to Treasury Multisig
- [ ] 150M SMESH transferred to Public Sale wallet (locked)
- [ ] 50M SMESH transferred to Market Maker wallet (12-month lock)
- [ ] Team vesting schedules created in TokenVesting
- [ ] `TokenVesting.transferOwnership(foundationMultisig)` called
- [ ] `SMESHToken` admin roles transferred from deployer to Foundation Multisig
- [ ] All contract addresses documented and published
