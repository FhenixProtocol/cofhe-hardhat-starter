# Private Composable Vault — Plan

**Concept:** A permissionless Multi-Strategy ERC-4626 vault platform where strategy weights,
rebalancing conditions, and allocation rules are encrypted via Fhenix FHE. Anyone deploys a
vault from a frontend. Yield is routed through Octant V2-style YDS/YSS primitives.
Principal is always preserved. Strategy alpha is never public.

**Target chain:** Fhenix (primary). Arbitrum (secondary, non-FHE mode).
**Positioning:** Yearn Finance but strategies are private. Octant but vaults are permissionless.

---

## System Overview

Six independent modules. Each module has one responsibility and one interface boundary.
No module reads another's internal state directly — only through defined entry points.

```
VaultFactory
  └── PrivateComposableVault (ERC-4626 surface)
        ├── EncryptedStrategyRegistry     ← FHE: weights + allocations
        ├── PrivateRebalancer             ← FHE: trigger conditions
        ├── YieldRouter                   ← public: splits + routes yield
        ├── AllocationMechanism           ← public: voting or fixed weights
        └── SelectiveDisclosureModule     ← FHE: auditor key reveal
```

---

## Phase 1 — PrivateComposableVault (Core ERC-4626)

**What this is:** The depositor-facing vault. Standard ERC-4626 interface. Share price is public.
Everything under the hood is sealed.

**Spec:**
- Implements full ERC-4626: `deposit`, `withdraw`, `mint`, `redeem`, `totalAssets`, `convertToShares`, `convertToAssets`
- Accepts a single `asset` token (e.g. USDC, WETH)
- Tracks `totalPrincipal` — sum of all user deposits, never accrues yield
- `totalAssets()` returns `totalPrincipal` only (principal-tracking vault, same as Octant YDS)
- Share price (`pricePerShare`) stays 1:1 with principal unless losses exceed the donation buffer
- Loss buffer: yield donated to donation address as shares; losses burn those shares first before touching user PPS
- Emits standard ERC-4626 events only. No strategy detail in events.
- Owner role: vault creator (set at deploy)
- Management role: keeper address (can call `report`)
- Emergency role: can pause deposits/withdrawals

**Inputs:**
- `asset` address
- `name`, `symbol`
- `donationAddress` — where yield shares are minted (Octant YDS pattern)
- `vaultCreatorFee` — encrypted (FHE `euint16`, basis points) — set at deploy, readable only by vault creator
- `maxStrategies` — plaintext cap (e.g. 10)

**Outputs / public surface:**
- `totalAssets()` — plaintext (principal only)
- `pricePerShare()` — plaintext
- `balanceOf(user)` — plaintext shares
- `strategyCount()` — plaintext count of attached strategies (not their identities or weights)

**What is NOT public:**
- Which strategies are attached
- What weight each strategy has
- What the rebalancing thresholds are
- The vault creator fee percentage

---

## Phase 2 — EncryptedStrategyRegistry

**What this is:** Stores the mapping of strategy addresses → encrypted allocation weights.
Only the vault and permissioned auditors can read weights.

**Spec:**
- Stores up to `maxStrategies` entries
- Each entry: `{ strategyAddress: address (plaintext), weight: euint16 (FHE), active: ebool (FHE) }`
- Strategy address is public (it's a deployed contract, its existence is observable) — only weight and active flag are encrypted
- `addStrategy(address strategy, InEuint16 weight)` — callable by vault owner only; encrypts weight on entry
- `removeStrategy(address strategy)` — sets `active` to `FHE.asEbool(false)`; does not zero weight (prevents strategy address from being used to infer timing)
- `updateWeight(address strategy, InEuint16 newWeight)` — callable by vault owner
- Invariant: sum of all active weights must equal a fixed denominator (e.g. 10000 bps). Enforced via FHE add + FHE eq check on every write. Reverts if invariant fails.
- `getTotalDebt(address strategy)` — returns `euint128` (encrypted actual debt deployed to each strategy). Accessible by `allowThis` and vault owner only.
- `allowAuditor(address auditor)` — vault owner can grant auditor `FHE.allow` on weight handles. This is the selective disclosure path.
- Access control: `FHE.allowThis` on all encrypted values at store time. `FHE.allowSender` when vault owner reads.

**Why FHE here matters:** Without this, any watcher can see which protocols get capital by watching `transfer` events from the vault. Weight encryption is the first layer. Strategy address is still visible, but weight + timing becomes ambiguous.

---

## Phase 3 — PrivateRebalancer

**What this is:** Stores encrypted rebalancing conditions. Computes whether rebalancing is
needed without revealing the trigger thresholds.

**Spec:**
- Stores per-vault: `{ driftThreshold: euint16, minTimeBetweenRebalances: euint32, lastRebalanceTimestamp: euint32 }`
- All three fields are FHE-encrypted
- `checkRebalanceNeeded(address vault) returns (ebool)` — computes:
  - `timeSinceLastRebalance = block.timestamp - lastRebalanceTimestamp` (plaintext sub, result encrypted)
  - `timeCondition = FHE.gte(timeSinceLastRebalance, minTimeBetweenRebalances)` → `ebool`
  - `driftCondition = FHE.gte(currentDrift, driftThreshold)` → `ebool` (currentDrift computed from EncryptedStrategyRegistry actual vs target weights)
  - `shouldRebalance = FHE.or(timeCondition, driftCondition)` → `ebool`
  - Returns `ebool` — caller cannot see the thresholds, only the outcome
- `triggerRebalance(address vault)`:
  - Calls `checkRebalanceNeeded` first; if `false`, reverts (FHE.select into a revert-or-continue pattern)
  - Reads encrypted weights from EncryptedStrategyRegistry
  - Computes per-strategy delta (encrypted)
  - Calls `_freeFunds` / `_deployFunds` on affected strategies using `FHE.select` to determine direction
  - Updates `lastRebalanceTimestamp`
- Keeper (plaintext role) can call `triggerRebalance`. They learn rebalancing happened but not why (thresholds stay hidden).

**Important FHE constraint:** `FHE.select` is used everywhere in place of `if (condition)`. The rebalancer never branches on a plaintext condition derived from encrypted state.

---

## Phase 4 — Strategy Layer (YDS / YSS adapters)

**What this is:** Individual strategy contracts that the vault deploys capital into.
Borrowed from Octant V2 YDS/YSS pattern with FHE-compatible modifications.

**Spec — Three required hooks per strategy:**
- `_deployFunds(uint256 amount)` — deploy `amount` of `asset` into external yield source (Aave, Compound, Lido, etc.)
- `_freeFunds(uint256 amount)` — withdraw `amount` from yield source back to vault
- `_harvestAndReport() returns (uint256 totalAssets)` — harvest rewards, return current total assets

**YDS variant (Yield Donating Strategy):**
- On `report()`: if profit, mint strategy shares to `donationAddress` (not to depositors)
- If loss: burn donation shares first (buffer). If loss > buffer, lower PPS.
- Principal is preserved as long as donation buffer > accumulated losses

**YSS variant (Yield Skimming Strategy):**
- For yield-bearing assets (e.g. stETH, aUSDC) whose value accrues via exchange rate
- On `report()`: captures exchange rate appreciation, converts to `asset`, sends to `donationAddress`
- User holds shares in the underlying yield-bearing token; appreciation is skimmed off continuously

**FHE note for strategies:**
- Strategies themselves are mostly plaintext EVM (deployed on Fhenix but not FHE-heavy)
- The strategy's `address` and `totalAssets` are readable by the vault
- The vault's EncryptedStrategyRegistry controls which strategy gets how much debt — that's where FHE lives
- Strategy balances visible on-chain are unavoidable (Aave position is public), but weight and trigger logic stay encrypted

**Permissioned roles per strategy:**
- `management`: vault address
- `keeper`: automation address
- `emergencyAdmin`: multisig

---

## Phase 5 — YieldRouter + AllocationMechanism

**What this is:** Once yield reaches the `donationAddress`, it needs to be split and forwarded.
This layer is fully public — transparency at the yield-distribution layer is a feature, not a bug.

**YieldRouter spec:**
- Receives ERC-4626 shares from YDS/YSS `report()` calls
- Calls the attached `AllocationMechanism` to get per-recipient weights
- Splits shares proportionally (pull model: recipients claim, not push)
- Emits `YieldRouted(epoch, totalShares, recipientCount)` — amounts per recipient are NOT in the event (claim is private to recipient)

**AllocationMechanism spec (two variants):**

Variant A — `FixedAllocationMechanism`:
- Vault creator sets fixed weights for recipients at deploy (e.g. 50% team treasury, 30% public goods, 20% stakers)
- Weights are plaintext (vault creator chooses to make this transparent)
- Immutable after deploy unless owner calls `updateRecipients`

Variant B — `VotingAllocationMechanism` (Octant QF-inspired):
- Depositors vote on recipient weights proportional to their share balance
- Voting period: configurable (e.g. 7 days per epoch)
- Uses quadratic voting math on plaintext balances (no FHE needed here — depositor balance is their own business)
- Results finalized by keeper at epoch end
- Implements `TokenizedAllocationMechanism` interface from Octant V2

**AllocationMechanismFactory:**
- Permissionless factory for deploying either variant
- Returns mechanism address to be attached to vault at creation or after deploy

---

## Phase 6 — SelectiveDisclosureModule

**What this is:** Allows vault owner to grant time-limited or role-limited decryption access
to auditors, regulators, or counterparties. This is the compliance wedge.

**Spec:**
- `grantAuditorAccess(address auditor, uint256 expiryTimestamp)`:
  - Calls `FHE.allow(weightHandle, auditor)` for all active strategy weights
  - Calls `FHE.allow(driftThreshold, auditor)`
  - Stores `auditorExpiry[auditor] = expiryTimestamp`
- `revokeAuditorAccess(address auditor)`:
  - Cannot un-`FHE.allow` (Fhenix access control is append-only in current model)
  - Instead, records revocation timestamp; frontend and off-chain tooling respect this
  - On-chain: future encrypted values created after revocation will not include auditor in `FHE.allow` calls
- `requestDecryption(address auditor, bytes32 valueHandle)`:
  - Callable by auditor only
  - Checks `block.timestamp < auditorExpiry[auditor]`
  - Calls `FHE.decrypt(handle)` — triggers threshold decryption
- `retrieveDecryption(bytes32 valueHandle) returns (uint256)`:
  - Second transaction: calls `FHE.getDecryptResult(handle)`
  - Returns plaintext only to caller who has FHE access
- Emits `AuditorAccessGranted(auditor, expiry)` and `DecryptionRequested(auditor, handle)` for audit trail

---

## Phase 7 — VaultFactory

**What this is:** The permissionless deployment contract. Anyone creates a vault from here.
Frontend calls this. One transaction, full vault deployed.

**Spec:**
- `createVault(VaultParams params) returns (address vault)`:
  - Deploys `PrivateComposableVault`
  - Deploys `EncryptedStrategyRegistry` linked to vault
  - Deploys `PrivateRebalancer` linked to vault
  - Deploys `SelectiveDisclosureModule` linked to vault
  - Deploys chosen `AllocationMechanism` variant via `AllocationMechanismFactory`
  - Wires all modules together via their constructor params
  - Registers vault in `VaultRegistry`
- `VaultParams` struct (plaintext inputs from frontend):
  - `asset`: address
  - `name`, `symbol`: string
  - `donationAddress`: address
  - `allocationMechanismType`: enum (FIXED | VOTING)
  - `initialRecipients`: address[] (for FIXED variant)
  - `initialWeights`: uint16[] (for FIXED variant, plaintext)
  - `vaultCreatorFeeEncrypted`: InEuint16 (encrypted at frontend, submitted as ciphertext)
  - `keeper`: address
  - `emergencyAdmin`: address
- `VaultRegistry`:
  - Stores all deployed vault addresses
  - Public `getAllVaults()` — anyone can enumerate vaults
  - Public `getVaultMetadata(address vault)` — returns asset, name, totalPrincipal, strategyCount (no strategy identities or weights)

---

## Phase 8 — Frontend (Octant-style UX)

**What this is:** A clean, minimal frontend where anyone can deploy or deposit into vaults.
Not a dashboard. A productivity tool.

**Three views:**

**View 1 — Explore Vaults**
- List of all vaults from VaultRegistry
- Per vault card: asset, TVL (totalPrincipal), APY estimate (based on historical yield route events), allocation mechanism type, vault creator alias (optional, ENS)
- No strategy details shown (they're encrypted)
- CTA: Deposit

**View 2 — Create Vault**
- Step 1: Choose asset
- Step 2: Choose yield strategies (multi-select from a curated registry of deployed strategy addresses)
- Step 3: Set encrypted weights (slider UI — values are encrypted client-side before submission using Fhenix SDK before tx)
- Step 4: Set allocation mechanism (FIXED with recipient list, or VOTING)
- Step 5: Set encrypted rebalancing thresholds (slider UI, encrypted client-side)
- Step 6: Set keeper, emergency admin, donation address
- Step 7: Deploy — single `createVault` tx
- After deploy: share vault link (public URL with vault address)

**View 3 — Manage Vault** (vault owner only)
- Add/remove strategies (with encrypted weight inputs)
- Update rebalancing thresholds
- Grant/revoke auditor access
- View decrypted state (owner has FHE access, can decrypt and view their own weights in-browser via Fhenix SDK)
- View yield routed per epoch (from public YieldRouted events)

**Key frontend FHE flow:**
- Fhenix SDK encrypts weight/threshold values client-side before they reach the chain
- Owner can request decryption in-browser: calls `FHE.decrypt` → waits one block → calls `FHE.getDecryptResult` → displays plaintext locally only

---

## Phase 9 — Testing Strategy

**Unit tests (per module):**
- PrivateComposableVault: ERC-4626 compliance (EIP-4626 test suite), deposit/withdraw/redeem math, PPS stability under profit and loss
- EncryptedStrategyRegistry: weight invariant enforcement, FHE access control (allowThis, allowSender, allowAuditor), add/remove/update flows
- PrivateRebalancer: `checkRebalanceNeeded` returns correct `ebool` for time and drift conditions, `triggerRebalance` updates timestamp, reverting on false condition
- YDS strategy: profit mints donation shares, loss burns buffer first, `_harvestAndReport` returns accurate totalAssets
- YSS strategy: exchange rate appreciation captured correctly, skimmed to donation address
- SelectiveDisclosureModule: multi-transaction decrypt flow (`vm.warp` + 11 seconds between decrypt and retrieve), expiry enforcement
- VaultFactory: full vault deployed correctly, all module addresses wired, vault appears in registry

**Integration tests:**
- Full lifecycle: deploy vault → add strategies → deposit → mine blocks → keeper reports → yield routed → recipient claims
- Loss scenario: loss < buffer (PPS stable) and loss > buffer (PPS drops)
- Rebalance scenario: drift threshold breached → keeper triggers → weights rebalanced
- Auditor scenario: owner grants access → auditor decrypts weight → expiry passes → new values not accessible

**FHE test notes (from core.md):**
- All decryption tests require `vm.warp(block.timestamp + 11)` between `FHE.decrypt` and `FHE.getDecryptResult`
- Use `FHE.getDecryptResultSafe()` in tests to check availability before asserting
- `ebool` returns from `checkRebalanceNeeded` cannot be used in `if` directly — use `FHE.select` or decrypt in test context

---

## Dependency Map

| Module | Depends On | Called By |
|--------|-----------|-----------|
| PrivateComposableVault | EncryptedStrategyRegistry, YieldRouter | VaultFactory, Depositors |
| EncryptedStrategyRegistry | Fhenix FHE.sol | PrivateComposableVault, PrivateRebalancer, SelectiveDisclosureModule |
| PrivateRebalancer | EncryptedStrategyRegistry, Fhenix FHE.sol | Keeper |
| YieldRouter | AllocationMechanism | YDS/YSS strategies (via report) |
| AllocationMechanism | — | YieldRouter, Depositor votes |
| SelectiveDisclosureModule | EncryptedStrategyRegistry, Fhenix FHE.sol | Vault owner, Auditors |
| VaultFactory | All modules | Frontend |

---

## Build Order

1. EncryptedStrategyRegistry (standalone, FHE-heavy, testable in isolation)
2. PrivateRebalancer (depends on registry)
3. YDS strategy adapter (plaintext EVM, reference Octant YDS hooks)
4. PrivateComposableVault (wires registry + rebalancer + strategies)
5. SelectiveDisclosureModule (depends on registry handles)
6. YieldRouter + AllocationMechanism (plaintext, independent)
7. VaultFactory (assembles everything)
8. Frontend (reads VaultRegistry, encrypts inputs via Fhenix SDK)

---

## Open Questions (resolve before build)

- **FHE weight invariant:** Can Fhenix FHE perform a running FHE sum check (sum of all `euint16` weights = 10000) in a single tx without gas explosion? Test this before committing to the invariant enforcement on-chain. Fallback: enforce off-chain with keeper validation.
- **Strategy address visibility:** Accepting that strategy addresses are public (their on-chain positions are observable). The value prop is hiding weights and triggers, not hiding that Aave is used. Confirm this tradeoff is acceptable for the target user.
- **YSS exchange rate feed:** Yield skimming strategies need an oracle for the yield-bearing token's exchange rate. Decide: Chainlink feed, or internal accounting from the token contract directly?
- **VaultCreatorFee distribution:** Encrypted fee bps stored, but how is fee extracted? Options: (a) skimmed from yield before donation route (complicates YDS math), or (b) separate fee claim that decrypts and transfers. Decide before Phase 4.
- **Fhenix mainnet vs testnet:** Confirm Fhenix coFHE mainnet readiness for hackathon deploy vs testnet-only.
