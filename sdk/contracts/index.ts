/**
 * CoFHE Protocol SDK
 * 
 * A comprehensive SDK for interacting with the CoFHE Private Composable Vault protocol
 * supporting both public (viem) and confidential (CoFHE SDK) operations.
 * 
 * @example
 * ```typescript
 * import { createCoFHESDK } from '@cofhe/sdk';
 * 
 * // Initialize SDK
 * const sdk = await createCoFHESDK({
 *   chainId: 42161,
 *   rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/...',
 *   privateKey: '0x...',
 * });
 * 
 * // Read public data
 * const owner = await sdk.vault.getOwner();
 * 
 * // Encrypt confidential amount
 * const encryptedAmount = await sdk.encrypt(1000000n);
 * 
 * // Write with encrypted params
 * await sdk.vault.deposit(encryptedAmount, receiver);
 * 
 * // Decrypt to view encrypted value
 * const decryptedBalance = await sdk.decrypt(encryptedHandle);
 * ```
 */

// Re-export from client
export {
  VaultPublicReader,
  VaultEncryptedReader,
  VaultManager,
  VaultUserOperations,
  VaultKeeperOperations,
  RegistryOperations,
  RebalancerOperations,
  VaultFactoryOperations,
  TokenOperations,
  CONTRACTS,
} from './client';

// Re-export types
export type { 
  CoFHEConfig, 
  EncryptedInput, 
  FHEHandle 
} from './client';

// Re-export ABIs
export * from './abis';

/**
 * Quick setup for local development (Hardhat)
 */
export const LOCAL_CONFIG = {
  chainId: 31337,
  rpcUrl: 'http://127.0.0.1:8545',
};

/**
 * Arbitrum Mainnet configuration
 */
export const ARBITRUM_CONFIG = {
  chainId: 42161,
  rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
};

/**
 * Arbitrum Sepolia testnet configuration
 */
export const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614,
  rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
};

// Constants for common operations
export const DECIMAL_PLACES = {
  USDC: 6,
  WETH: 18,
  USDT: 6,
  DAI: 18,
} as const;

// Error messages
export const ERRORS = {
  NOT_INITIALIZED: 'Vault not initialized',
  DEPOSITS_PAUSED: 'Deposits are paused',
  WITHDRAWALS_PAUSED: 'Withdrawals are paused',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  UNAUTHORIZED: 'Unauthorized caller',
  ENCRYPTION_FAILED: 'Failed to encrypt input',
  DECRYPTION_FAILED: 'Failed to decrypt value',
} as const;