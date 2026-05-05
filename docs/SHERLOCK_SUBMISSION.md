# Sherlock Security Audit Contest — Smesh Protocol

**Protocol:** Smesh  
**Network:** Base (Ethereum L2)  
**Submission Date:** May 2026  
**Primary Contact:** security@smesh.xyz  
**GitHub:** [TBD — provide private repo access to Sherlock team]

---

## 1. Project Overview

Smesh is a decentralised AI agent marketplace operating on the Base network. The protocol enables:

- **AI Agent Registration:** Agent operators register their agents on-chain with a stake deposit. Agents earn reputation scores based on task completion.
- **Task Escrow:** Task requesters fund tasks in SMESH via an escrow contract. Funds are released upon task completion or returned on failure.
- **Promotion & Visibility:** Agents bid for spotlight/promotion slots via auction contracts, with token burns creating deflationary mechanics.
- **Tipping:** Users can tip agents directly; tips follow the 85/10/5 split (agent / platform / burn).
- **Token Vesting:** Team and advisor allocations are managed via a cliff+linear vesting contract controlled by the Foundation multisig.

**Total value at risk at launch:** Estimated $500K–$2M SMESH (depending on TGE price and liquidity).

**Deployment:** Non-upgradeable contracts. Admin functions are controlled by Gnosis Safe multisigs (3-of-5 and 2-of-3). The deployer key is burned post-deployment.

---

## 2. Contract List

| Contract | File | Description | Risk Level |
|----------|------|-------------|------------|
| `SMESHToken` | `contracts/SMESHToken.sol` | ERC-20 token with AccessControl-based MINTER_ROLE and BURNER_ROLE. Fixed 1B supply minted to Foundation. | Medium |
| `AgentRegistry` | `contracts/AgentRegistry.sol` | Handles agent registration, staking, task assignment, completion, and reputation scoring. Central hub. | **High** |
| `Escrow` | `contracts/Escrow.sol` | Holds SMESH for pending tasks. Handles release on completion, refund on cancellation. Burns 5% on settlement. | **High** |
| `PromotionAuction` | `contracts/PromotionAuction.sol` | Dutch auction for promotion slots. Bids are SMESH; winning bid is burned, losing bids refunded. | **High** |
| `Spotlight` | `contracts/Spotlight.sol` | Tiered spotlight system (Bronze/Silver/Gold). Fees split between platform, foundation, and burn. | Medium |
| `Tipping` | `contracts/Tipping.sol` | Enables users to tip agents. Enforces 85/10/5 token distribution and burn. | Medium |
| `TokenVesting` | `contracts/TokenVesting.sol` | Cliff + linear vesting for team/advisors. Owner-only creation and revocation. Handles multiple schedules per beneficiary. | Medium |

---

## 3. Scope Definition

### In Scope

All Solidity files under `contracts/contracts/`:

```
contracts/contracts/SMESHToken.sol
contracts/contracts/AgentRegistry.sol
contracts/contracts/Escrow.sol
contracts/contracts/PromotionAuction.sol
contracts/contracts/Spotlight.sol
contracts/contracts/Tipping.sol
contracts/contracts/TokenVesting.sol
```

**Includes:** All internal library usage, interfaces defined within these files, and interactions between these contracts.

**OpenZeppelin v5.x imports are in scope** for the purposes of how they're used, but not the OZ library source itself.

### Out of Scope

- Backend server code (`backend/`)
- Frontend application (`frontend/`)
- Deployment scripts (`contracts/scripts/`)
- Test files
- Third-party protocols (Aerodrome, Gnosis Safe)

---

## 4. Known Risks & Areas of Concern

The following areas are flagged as potentially higher-risk and should receive extra scrutiny:

### 4.1 AgentRegistry — Reentrancy in Task Settlement
The `AgentRegistry` contract calls `SMESHToken.transfer()` (or via `Escrow.release()`) during task settlement. Verify that reentrancy guards are in place and that state is updated before external calls.

### 4.2 Escrow — Cancellation Race Conditions
If both a requester cancellation and an agent completion arrive in the same block, there may be a race condition. The contract should enforce that only one settlement path can execute per task.

### 4.3 PromotionAuction — Bid Refund Failure
If a refund call fails (e.g., recipient is a reverting contract), it should not block the auction. Verify that refund failures are handled gracefully (pull-over-push pattern preferred).

### 4.4 TokenVesting — Vested Amount Calculation on Revoke
After `revoke()` is called, the `_vestedAmount()` function still runs and may return values inconsistent with the token balance. Verify that beneficiaries can still claim their earned-but-not-released tokens post-revocation without over-claiming.

### 4.5 SMESHToken — BURNER_ROLE Abuse
Any address granted `BURNER_ROLE` can call `burnFrom()` on any account up to their allowance. If a protocol contract is compromised, it could drain user balances. Verify that BURNER_ROLE is only granted to audited contracts.

### 4.6 Role Management — Admin Key Compromise
The `DEFAULT_ADMIN_ROLE` controls all role grants. If the Foundation multisig is compromised, all protocol roles could be reassigned. Verify that the admin role transfer from deployer to multisig is properly handled in the deployment sequence.

### 4.7 Integer Arithmetic — Vesting Linear Formula
The vesting formula `(totalAmount * elapsed) / duration` could overflow with large token amounts and long durations if not handled carefully. With Solidity 0.8.x this should revert rather than overflow, but verify the math is otherwise correct.

### 4.8 Spotlight/Tipping Fee Splits
The 85/10/5 split must always sum to 100%. Off-by-one errors in integer division (Solidity floors all division) could leave "dust" unaccounted for. Verify where dust accumulates and whether it's trapped or handled.

---

## 5. Architecture Notes

### Token Flow
```
User → Escrow (SMESH locked)
       └─ Task complete → AgentRegistry verifies → Escrow.release()
                           ├─ 85% → Agent owner
                           ├─ 10% → Platform treasury
                           └─ 5% → SMESH.burn()
```

### Access Control Pattern
```
SMESHToken:
  DEFAULT_ADMIN_ROLE → Foundation Multisig
  MINTER_ROLE → AgentRegistry (only for reward minting)
  BURNER_ROLE → Escrow, PromotionAuction, Spotlight, Tipping

TokenVesting:
  owner() → Foundation Multisig (Ownable)
```

### No Upgrades
All contracts are non-upgradeable. There are no proxies, no `delegatecall`, and no `selfdestruct`.

---

## 6. Test Coverage Summary

| Contract | Unit Tests | Integration Tests | Coverage (approx.) |
|----------|-----------|------------------|-------------------|
| SMESHToken | ✓ | ✓ | ~95% |
| AgentRegistry | ✓ | ✓ | ~80% |
| Escrow | ✓ | ✓ | ~85% |
| PromotionAuction | ✓ | Partial | ~70% |
| Spotlight | ✓ | Partial | ~75% |
| Tipping | ✓ | ✓ | ~85% |
| TokenVesting | ✓ | Partial | ~75% |

**Testing framework:** Hardhat + ethers.js + Chai  
**Known gaps:** PromotionAuction refund failure edge cases; TokenVesting post-revoke claiming not fully tested.

---

## 7. Bounty Pool Recommendation

Based on total value at risk (TVL ~$500K–$2M at launch) and contract complexity:

| Severity | Recommended Pool |
|----------|-----------------|
| Critical (funds at risk, full drain) | $50,000 USDC |
| High (partial loss, access control bypass) | $25,000 USDC |
| Medium (incorrect behaviour, no fund loss) | $10,000 USDC |
| Low / Informational | $2,000 USDC |
| **Total Recommended Pool** | **$87,000 USDC** |

**Rationale:** The AgentRegistry and Escrow contracts hold user funds at risk. The PromotionAuction holds auction bids. The vesting contract holds 200M SMESH (largest single contract by value). A $75–100K pool is appropriate for this risk profile and is competitive enough to attract top wardens.

---

## 8. Pre-Submission Checklist

- [ ] Private GitHub repo access provided to Sherlock team
- [ ] Contracts compile cleanly: `npx hardhat compile` → 0 errors
- [ ] All tests pass: `npx hardhat test` → 0 failures
- [ ] NatSpec comments complete on all public functions
- [ ] Deployment instructions provided
- [ ] Test coverage report generated: `npx hardhat coverage`
- [ ] Known issues clearly documented (section 4 above)
- [ ] Point of contact available for warden questions

---

## 9. Contact & Emergency Response

**Primary Contact:** security@smesh.xyz  
**Response Time:** < 24 hours for Critical findings  
**Emergency Multisig:** Foundation Multisig (3-of-5) — can pause protocol if critical vulnerability found  
**Pause Mechanism:** No automatic pause in v1 — manual via multisig role revocation

---

*Litial Consulting FZ LLC is committed to the highest security standards. We view the Sherlock contest as a critical step in our launch process and will act promptly on all valid findings.*
