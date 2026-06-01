# CoFHE Protocol SDK

A comprehensive TypeScript SDK for interacting with the CoFHE Private Composable Vault protocol, supporting both public (via viem) and confidential (via CoFHE SDK) operations.

## Features

- **Public Read Operations**: Read vault state without encryption
- **Confidential Write Operations**: Send transactions with encrypted inputs
- **Permission Management**: Handle cross-contract encrypted calls
- **Decryption Support**: View encrypted on-chain values

## Installation

```bash
npm install viem @cofhe/sdk
```

## Quick Start

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import { createClientWithBatteries, Encryptable, FheTypes } from '@cofhe/sdk';
import { VaultPublicReader, VaultUserOperations, TokenOperations } from '@cofhe/protocol-sdk';
import { PrivateComposableVaultAbi } from './abis';

// Setup clients
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http('https://arb-mainnet.g.alchemy.com/v2/...'),
});

const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: arbitrum,
  transport: http('https://arb-mainnet.g.alchemy.com/v2/...'),
});

// Create CoFHE client for encrypted operations
const cofheClient = await createClientWithBatteries(account);

// Initialize SDK classes
const vaultAddress = '0x...' as const;
const vault = new VaultPublicReader(publicClient, vaultAddress);

// Read public data (no encryption needed)
const owner = await vault.getOwner();
const totalAssets = await vault.getTotalAssets();
console.log('Vault Owner:', owner);
console.log('Total Assets:', totalAssets);

// Encrypted deposit
const encryptedAmount = await cofheClient.encryptInputs([
  Encryptable.uint256(1000000n * 1000000n) // 1M USDC
]).execute();

const vaultOps = new VaultUserOperations(walletClient, vaultAddress);
await vaultOps.deposit(encryptedAmount[0], account.address);

// Decrypt to view encrypted balance
const encryptedBalance = await publicClient.readContract({
  address: vaultAddress,
  abi: PrivateComposableVaultAbi,
  functionName: 'balanceOf',
  args: [account.address],
});

const balance = await cofheClient.decryptForView(
  encryptedBalance,
  FheTypes.Uint256
).execute();
console.log('Decrypted Balance:', balance);
```

## Architecture

```
sdk/
├── contracts/
│   ├── abis/           # Exported contract ABIs
│   │   ├── PrivateComposableVault.json
│   │   ├── EncryptedStrategyRegistry.json
│   │   └── ...
│   ├── client.ts       # Main SDK classes
│   ├── examples.ts     # Usage examples
│   └── index.ts        # Main export
└── README.md
```

## SDK Classes

### VaultPublicReader
Read-only operations that don't require encryption:
- `getOwner()` - Get vault owner address
- `getAsset()` - Get underlying asset (token) address
- `getTotalAssets()` - Get total vault assets
- `areDepositsPaused()` - Check deposit status
- `getBalanceOf(account)` - Get user's share balance

### VaultUserOperations
User deposit/withdraw operations:
- `deposit(amount, receiver)` - Deposit tokens
- `withdraw(shares, receiver, owner)` - Withdraw tokens

### VaultManager
Owner-only vault management:
- `pauseDeposits()` / `unpauseDeposits()`
- `addStrategy(strategy)` / `removeStrategy(strategy)`
- `updateKeeper(keeper)`

### VaultKeeperOperations
Keeper role operations:
- `deployToStrategy(strategy, amount)` - Deploy funds
- `report(strategy)` - Report gains/losses
- `rebalanceStrategy(strategy, amount, isWithdraw)`

### RegistryOperations
Strategy registry operations:
- `addStrategy(strategy, encryptedWeight)` - Add with encrypted weight
- `updateWeight(strategy, encryptedWeight)` - Update encrypted weight
- `getEncryptedWeight(strategy)` - Get encrypted weight (requires decryption)

### RebalancerOperations
Private rebalancer operations:
- `configureVault(vault, encryptedDrift, encryptedMinTime)` - Configure vault
- `checkRebalanceNeeded(vault, registry, drift)` - Check (encrypted result)

## Encrypted Operations

### Encrypting Inputs

```typescript
const encryptedFee = await cofheClient.encryptInputs([
  Encryptable.uint16(200n) // 2% creator fee
]).execute();
```

### Decrypting Outputs

```typescript
const encryptedHandle = await publicClient.readContract({
  address: vaultAddress,
  abi: PrivateComposableVaultAbi,
  functionName: 'getCreatorFee',
});

const fee = await cofheClient.decryptForView(
  encryptedHandle,
  FheTypes.Uint16
).execute();
console.log('Creator Fee:', fee, 'bps');
```

## Contract ABIs

The SDK includes ABIs for:

| Contract | Description |
|----------|-------------|
| `PrivateComposableVault` | Main vault with encrypted balances |
| `EncryptedStrategyRegistry` | Strategy management with encrypted weights |
| `PrivateRebalancer` | Encrypted rebalancing decisions |
| `YieldRouter` | Yield donation routing |
| `VaultFactory` | Vault deployment factory |
| `FixedAllocationMechanism` | Fixed allocation for yield distribution |

## External Contracts (Arbitrum)

| Contract | Address |
|----------|---------|
| Aave V3 Pool | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |
| Uniswap V3 Factory | `0x1F98431c8aD98523631AE4a59f267346ea31F984` |
| Uniswap V3 Router | `0xE592427A0AEce92De3Edee1F18E0157C05861564` |
| WETH | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` |

## Error Handling

```typescript
import { ERRORS } from '@cofhe/protocol-sdk';

try {
  await vault.deposit(amount, receiver);
} catch (error) {
  if (error.message.includes('PCV: deposits paused')) {
    console.log('Deposits are paused');
  } else if (error.message.includes('PCV: insufficient balance')) {
    console.log('Not enough shares');
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/FullLifecycle.test.ts
```

## License

MIT