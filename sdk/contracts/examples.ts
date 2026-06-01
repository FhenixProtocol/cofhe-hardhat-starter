/**
 * Example: Using the CoFHE Protocol SDK
 * 
 * This file demonstrates how to use the SDK for various operations.
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, foundry } from 'viem/chains';
import { 
  VaultPublicReader, 
  VaultManager,
  VaultUserOperations,
  VaultKeeperOperations,
  RegistryOperations,
  TokenOperations,
} from './client';
import { PrivateComposableVaultAbi } from './abis';

// ============================================================================
// CONFIGURATION
// ============================================================================

// For Arbitrum Mainnet
const ARBITRUM_RPC = 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY';
const PRIVATE_KEY = '0xyour_private_key' as const;

// For local Hardhat testing
const LOCAL_RPC = 'http://127.0.0.1:8545';

// Example vault address
const VAULT_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const ASSET_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const; // USDC on Arbitrum

// ============================================================================
// SETUP CLIENTS
// ============================================================================

function setupArbitrumClients() {
  // Public client for read operations
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(ARBITRUM_RPC),
  });

  // Wallet client for write operations
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(ARBITRUM_RPC),
  });

  return { publicClient, walletClient, account };
}

function setupLocalClients() {
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(LOCAL_RPC),
  });

  const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(LOCAL_RPC),
  });

  return { publicClient, walletClient, account };
}

// ============================================================================
// PUBLIC READ OPERATIONS
// ============================================================================

async function examplePublicReads(publicClient: ReturnType<typeof createPublicClient>) {
  const vault = new VaultPublicReader(publicClient, VAULT_ADDRESS);

  // Get vault info
  const owner = await vault.getOwner();
  console.log('Vault Owner:', owner);

  const asset = await vault.getAsset();
  console.log('Vault Asset:', asset);

  const isDepositsPaused = await vault.areDepositsPaused();
  console.log('Deposits Paused:', isDepositsPaused);

  const totalAssets = await vault.getTotalAssets();
  console.log('Total Assets:', totalAssets);

  const totalPrincipal = await vault.getTotalPrincipal();
  console.log('Total Principal:', totalPrincipal);

  const strategyCount = await vault.getStrategyCount();
  console.log('Strategy Count:', strategyCount);

  // Get user's public share balance (not encrypted)
  const userAddress = '0x1234...' as const;
  const shares = await vault.getBalanceOf(userAddress);
  console.log('User Shares:', shares);
}

// ============================================================================
// USER OPERATIONS (DEPOSIT/WITHDRAW)
// ============================================================================

async function exampleUserOperations(
  walletClient: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>
) {
  const vault = new VaultUserOperations(walletClient, VAULT_ADDRESS);
  const token = new TokenOperations(walletClient, publicClient, ASSET_ADDRESS);

  const userAddress = '0x1234...' as const;
  const depositAmount = 1000000n * 1000000n; // 1,000,000 USDC (6 decimals)

  // Step 1: Approve vault to spend tokens
  console.log('Approving vault...');
  const approveTx = await token.approve(VAULT_ADDRESS, depositAmount);
  console.log('Approve TX:', approveTx);

  // Step 2: Deposit tokens
  console.log('Depositing...');
  const depositTx = await vault.deposit(depositAmount, userAddress);
  console.log('Deposit TX:', depositTx);

  // Step 3: Withdraw (burn shares, receive tokens)
  console.log('Withdrawing...');
  const withdrawTx = await vault.withdraw(500000n * 1000000n, userAddress, userAddress);
  console.log('Withdraw TX:', withdrawTx);
}

// ============================================================================
// KEEPER OPERATIONS
// ============================================================================

async function exampleKeeperOperations(
  walletClient: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>
) {
  const vault = new VaultKeeperOperations(walletClient, VAULT_ADDRESS);
  const strategyAddress = '0x5678...' as const;

  // Deploy funds to strategy
  const deployAmount = 500000n * 1000000n;
  console.log('Deploying to strategy...');
  const deployTx = await vault.deployToStrategy(strategyAddress, deployAmount);
  console.log('Deploy TX:', deployTx);

  // Report gains/losses (mints donation shares for profits)
  console.log('Reporting...');
  const reportTx = await vault.report(strategyAddress);
  console.log('Report TX:', reportTx);

  // Rebalance strategy
  console.log('Rebalancing...');
  const rebalanceTx = await vault.rebalanceStrategy(strategyAddress, 100000n * 1000000n, true);
  console.log('Rebalance TX:', rebalanceTx);
}

// ============================================================================
// VAULT OWNER OPERATIONS
// ============================================================================

async function exampleOwnerOperations(
  walletClient: ReturnType<typeof createWalletClient>
) {
  const vault = new VaultManager(walletClient, VAULT_ADDRESS);

  // Pause deposits for maintenance
  console.log('Pausing deposits...');
  const pauseTx = await vault.pauseDeposits();
  console.log('Pause TX:', pauseTx);

  // Resume deposits
  console.log('Resuming deposits...');
  const resumeTx = await vault.unpauseDeposits();
  console.log('Resume TX:', resumeTx);

  // Add new strategy
  const newStrategy = '0x7890...' as const;
  console.log('Adding strategy...');
  const addTx = await vault.addStrategy(newStrategy);
  console.log('Add Strategy TX:', addTx);

  // Update keeper
  const newKeeper = '0xabcd...' as const;
  console.log('Updating keeper...');
  const keeperTx = await vault.updateKeeper(newKeeper);
  console.log('Update Keeper TX:', keeperTx);
}

// ============================================================================
// REGISTRY OPERATIONS
// ============================================================================

async function exampleRegistryOperations(
  walletClient: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>
) {
  const registry = new RegistryOperations(
    walletClient, 
    publicClient, 
    '0xregistry_address...' as const
  );

  // Read strategy count
  const count = await registry.getStrategyCount();
  console.log('Strategy Count:', count);

  // Get all strategy addresses
  for (let i = 0n; i < count; i++) {
    const strategy = await registry.getStrategyAddress(i);
    console.log(`Strategy ${i}:`, strategy);
  }

  // Check if strategy is registered
  const isRegistered = await registry.isStrategyRegistered('0xstrategy...' as const);
  console.log('Is Registered:', isRegistered);
}

// ============================================================================
// CONFIDENTIAL OPERATIONS (with CoFHE SDK)
// ============================================================================

/**
 * For confidential operations, you need the CoFHE SDK to:
 * 1. Encrypt inputs before sending transactions
 * 2. Decrypt outputs to view encrypted values
 * 
 * Example with CoFHE SDK:
 * 
 * ```typescript
 * import { createClientWithBatteries, Encryptable } from '@cofhe/sdk';
 * 
 * // Create CoFHE client
 * const cofheClient = await createClientWithBatteries(walletClient.account);
 * 
 * // Encrypt confidential amount
 * const encryptedAmount = await cofheClient.encryptInputs([
 *   Encryptable.uint256(1000000n)
 * ]).execute();
 * 
 * // Write with encrypted params
 * const tx = await walletClient.writeContract({
 *   address: VAULT_ADDRESS,
 *   abi: PrivateComposableVaultAbi,
 *   functionName: 'deposit',
 *   args: [encryptedAmount[0]], // encrypted amount
 * });
 * 
 * // Decrypt encrypted handle to view value
 * const encryptedHandle = await publicClient.readContract({
 *   address: VAULT_ADDRESS,
 *   abi: PrivateComposableVaultAbi,
 *   functionName: 'balanceOf',
 *   args: [userAddress],
 * });
 * 
 * const decryptedBalance = await cofheClient.decryptForView(
 *   encryptedHandle,
 *   FheTypes.Uint256
 * ).execute();
 * console.log('Decrypted Balance:', decryptedBalance);
 * ```
 */

// ============================================================================
// DECRYPTION EXAMPLE
// ============================================================================

/**
 * How to decrypt encrypted on-chain values:
 * 
 * 1. Get the encrypted handle from a read operation
 * 2. Use the CoFHE SDK to request decryption
 * 3. Wait for the decryption result (async process)
 * 4. Read the decrypted value
 */

/**
 * Complete deposit flow with encryption:
 * 
 * ```typescript
 * // 1. Create encrypted amount
 * const encryptedAmount = await cofheClient.encryptInputs([
 *   Encryptable.uint256(1000000n)
 * ]).execute();
 * 
 * // 2. Approve token spending (not encrypted)
 * await token.approve(vaultAddress, 1000000n * 1000000n);
 * 
 * // 3. Deposit with encrypted amount (confidential)
 * await vault.deposit(encryptedAmount[0], receiver);
 * 
 * // 4. User's balance is encrypted - only they can decrypt it
 * const encryptedBalance = await publicClient.readContract({
 *   address: vaultAddress,
 *   abi: PrivateComposableVaultAbi,
 *   functionName: 'balanceOf',
 *   args: [userAddress],
 * });
 * 
 * // 5. User decrypts to see their balance (nobody else can)
 * const balance = await cofheClient.decryptForView(
 *   encryptedBalance,
 *   FheTypes.Uint256
 * ).execute();
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Common errors and how to handle them:
 * 
 * - "PCV: deposits paused" - Deposits are temporarily disabled
 * - "PCV: withdrawals paused" - Withdrawals are temporarily disabled
 * - "PCV: insufficient balance" - Not enough shares to withdraw
 * - "ESR: not owner" - Caller is not the vault owner
 * - "ESR: strategy not found" - Strategy not registered
 * - "PR: not factory" - Caller is not the rebalancer factory
 */

// ============================================================================
// MAIN EXAMPLE
// ============================================================================

async function main() {
  // Setup for local Hardhat testing
  const { publicClient, walletClient } = setupLocalClients();

  console.log('=== CoFHE Protocol SDK Examples ===\n');

  // Example: Public reads
  console.log('--- Public Reads ---');
  await examplePublicReads(publicClient);

  // Example: User operations (requires tokens)
  // console.log('\n--- User Operations ---');
  // await exampleUserOperations(walletClient, publicClient);

  // Example: Keeper operations (requires keeper role)
  // console.log('\n--- Keeper Operations ---');
  // await exampleKeeperOperations(walletClient, publicClient);

  // Example: Owner operations (requires owner role)
  // console.log('\n--- Owner Operations ---');
  // await exampleOwnerOperations(walletClient);

  // Example: Registry operations
  // console.log('\n--- Registry Operations ---');
  // await exampleRegistryOperations(walletClient, publicClient);
}

// Run examples
main().catch(console.error);

export {
  setupArbitrumClients,
  setupLocalClients,
  examplePublicReads,
  exampleUserOperations,
  exampleKeeperOperations,
  exampleOwnerOperations,
  exampleRegistryOperations,
};