# Contract ABIs

Auto-generated ABIs for the CoFHE Private Composable Vault protocol.

## Contracts
- **PrivateComposableVault**
- **EncryptedStrategyRegistry**
- **PrivateRebalancer**
- **YieldRouter**
- **MockStrategy**
- **MockAavePool**
- **FixedAllocationMechanism**
- **VaultFactory**
- **MockERC20**
- **Counter**

## Usage with viem

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import { PrivateComposableVaultAbi } from './abis';

// Public client for read operations
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// Read contract state
const owner = await publicClient.readContract({
  address: '0x...',
  abi: PrivateComposableVaultAbi,
  functionName: 'owner',
});
```

## Usage with CoFHE SDK (Encrypted Operations)

```typescript
import { createClientWithBatteries } from '@cofhe/sdk';
import { Encryptable } from '@cofhe/sdk';

// Create CoFHE client
const cofheClient = await createClientWithBatteries(signer);

// Encrypt inputs for confidential operations
const encryptedAmount = await cofheClient.encryptInputs([
  Encryptable.uint256(1000000n)
]).execute();

// Write with encrypted params
await walletClient.writeContract({
  address: '0x...',
  abi: PrivateComposableVaultAbi,
  functionName: 'deposit',
  args: [encryptedAmount[0]],
});
```

## External Contract ABIs

Aave V3 Pool: `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
Uniswap V3 Factory: `0x1F98431c8aD98523631AE4a59f267346ea31F984`
Uniswap V3 Router: `0xE592427A0AEce92De3Edee1F18E0157C05861564`
WETH: `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`
