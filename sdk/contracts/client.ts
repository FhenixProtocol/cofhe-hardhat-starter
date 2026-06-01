/**
 * CoFHE Protocol SDK - Client for Confidential Operations
 * 
 * This module provides a unified interface for interacting with the CoFHE
 * Private Composable Vault protocol using viem and the CoFHE SDK.
 * 
 * Features:
 * - Public read operations (no encryption needed)
 * - Confidential write operations (encrypted inputs via CoFHE)
 * - Permission management for cross-contract encrypted calls
 * - Decryption for viewing encrypted on-chain values
 */

import { createPublicClient, createWalletClient, http, Hash, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Chain, Transport } from 'viem';
import { FheTypes } from '@cofhe/sdk';

// Import ABIs
import { 
  PrivateComposableVaultAbi,
  EncryptedStrategyRegistryAbi,
  PrivateRebalancerAbi,
  YieldRouterAbi,
  VaultFactoryAbi,
  FixedAllocationMechanismAbi,
  MockERC20Abi,
  CounterAbi,
} from './abis';

// Contract addresses by network
export const CONTRACTS = {
  42161: { // Arbitrum Mainnet
    vaultFactory: '0x0000000000000000000000000000000000000001' as const,
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
    aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const,
    uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as const,
    uniswapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const,
  },
  421614: { // Arbitrum Sepolia
    vaultFactory: '0x0000000000000000000000000000000000000001' as const,
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
    aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const,
    uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as const,
    uniswapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const,
  },
  31337: { // Local Hardhat
    vaultFactory: '0x0000000000000000000000000000000000000001' as const,
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
    aavePool: '0x0000000000000000000000000000000000000002' as const,
    uniswapFactory: '0x0000000000000000000000000000000000000003' as const,
    uniswapRouter: '0x0000000000000000000000000000000000000004' as const,
  },
} as const;

// Type for InEuint encrypted input (from CoFHE)
export interface EncryptedInput {
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: `0x${string}`;
}

// Type for on-chain encrypted handle
export interface FHEHandle {
  ctHash: bigint;
  [key: string]: unknown;
}

/**
 * Configuration for the CoFHE Protocol SDK
 */
export interface CoFHEConfig {
  chainId: number;
  rpcUrl?: string;
  privateKey?: `0x${string}`;
  walletClient?: WalletClient;
  publicClient?: PublicClient;
}

/**
 * Public (non-confidential) read operations for PrivateComposableVault
 */
export class VaultPublicReader {
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(publicClient: PublicClient, address: `0x${string}`) {
    this.publicClient = publicClient;
    this.address = address;
  }

  /**
   * Get vault owner
   */
  async getOwner(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'owner',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Get vault keeper address
   */
  async getKeeper(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'keeper',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Get vault asset (token) address
   */
  async getAsset(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'asset',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Check if deposits are paused
   */
  async areDepositsPaused(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'depositsPaused',
    }) as Promise<boolean>;
  }

  /**
   * Check if withdrawals are paused
   */
  async areWithdrawalsPaused(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'withdrawalsPaused',
    }) as Promise<boolean>;
  }

  /**
   * Get total assets (includes strategies)
   */
  async getTotalAssets(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'totalAssets',
    }) as Promise<bigint>;
  }

  /**
   * Get total principal (user deposits)
   */
  async getTotalPrincipal(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'totalPrincipal',
    }) as Promise<bigint>;
  }

  /**
   * Get price per share (always returns 1e18 for 1:1)
   */
  async getPricePerShare(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'pricePerShare',
    }) as Promise<bigint>;
  }

  /**
   * Get vault name
   */
  async getName(): Promise<string> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'name',
    }) as Promise<string>;
  }

  /**
   * Get vault symbol
   */
  async getSymbol(): Promise<string> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'symbol',
    }) as Promise<string>;
  }

  /**
   * Get strategy count
   */
  async getStrategyCount(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'strategyCount',
    }) as Promise<bigint>;
  }

  /**
   * Get registry address
   */
  async getRegistry(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'registry',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Get yield router address
   */
  async getYieldRouter(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'yieldRouter',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Get rebalancer address
   */
  async getRebalancer(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'rebalancer',
    }) as Promise<`0x${string}`>;
  }

  /**
   * Check if vault is initialized
   */
  async isInitialized(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'isInitialized',
    }) as Promise<boolean>;
  }

  /**
   * Get total supply (shares minted)
   */
  async getTotalSupply(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'totalSupply',
    }) as Promise<bigint>;
  }

  /**
   * Get user's share balance (public balanceOf)
   */
  async getBalanceOf(account: `0x${string}`): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'balanceOf',
      args: [account],
    }) as Promise<bigint>;
  }
}

/**
 * Encrypted (confidential) operations - returns handles that need decryption
 */
export class VaultEncryptedReader {
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(publicClient: PublicClient, address: `0x${string}`) {
    this.publicClient = publicClient;
    this.address = address;
  }

  /**
   * Get user's encrypted balance (requires decryption to view)
   * Returns an FHE handle that can be decrypted using the CoFHE SDK
   */
  async getEncryptedBalanceOf(account: `0x${string}`): Promise<FHEHandle> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'balanceOf',
      args: [account],
    }) as Promise<FHEHandle>;
  }

  /**
   * Get encrypted creator fee (requires decryption to view)
   */
  async getEncryptedCreatorFee(): Promise<FHEHandle> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'getCreatorFee',
    }) as Promise<FHEHandle>;
  }
}

/**
 * Write operations for vault management (owner only)
 */
export class VaultManager {
  private walletClient: WalletClient;
  private address: `0x${string}`;

  constructor(walletClient: WalletClient, address: `0x${string}`) {
    this.walletClient = walletClient;
    this.address = address;
  }

  /**
   * Initialize vault with components (one-time setup)
   */
  async initialize(
    registry: `0x${string}`,
    yieldRouter: `0x${string}`,
    rebalancer: `0x${string}`
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'initialize',
      args: [registry, yieldRouter, rebalancer],
    });
  }

  /**
   * Pause deposits (owner or emergency admin)
   */
  async pauseDeposits(): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'pauseDeposits',
    });
  }

  /**
   * Unpause deposits (owner only)
   */
  async unpauseDeposits(): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'unpauseDeposits',
    });
  }

  /**
   * Pause withdrawals (owner or emergency admin)
   */
  async pauseWithdrawals(): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'pauseWithdrawals',
    });
  }

  /**
   * Unpause withdrawals (owner only)
   */
  async unpauseWithdrawals(): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'unpauseWithdrawals',
    });
  }

  /**
   * Add strategy to vault (owner only)
   */
  async addStrategy(strategy: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'addStrategy',
      args: [strategy],
    });
  }

  /**
   * Remove strategy from vault (owner only)
   */
  async removeStrategy(strategy: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'removeStrategy',
      args: [strategy],
    });
  }

  /**
   * Transfer vault ownership (owner only)
   */
  async transferOwnership(newOwner: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'transferOwnership',
      args: [newOwner],
    });
  }

  /**
   * Update rebalancer address (owner only)
   */
  async updateRebalancer(rebalancer: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'updateRebalancer',
      args: [rebalancer],
    });
  }

  /**
   * Update keeper address (owner only)
   */
  async updateKeeper(keeper: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'updateKeeper',
      args: [keeper],
    });
  }
}

/**
 * User operations (deposit/withdraw) - some require encrypted amounts
 */
export class VaultUserOperations {
  private walletClient: WalletClient;
  private address: `0x${string}`;

  constructor(walletClient: WalletClient, address: `0x${string}`) {
    this.walletClient = walletClient;
    this.address = address;
  }

  /**
   * Deposit assets (plaintext amount, receiver is public)
   * The vault tracks encrypted balances internally
   */
  async deposit(
    amount: bigint,
    receiver: `0x${string}`
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'deposit',
      args: [amount, receiver],
    });
  }

  /**
   * Withdraw assets (shares burned, assets returned)
   * User's encrypted balance is decrypted to determine eligibility
   */
  async withdraw(
    shares: bigint,
    receiver: `0x${string}`,
    owner: `0x${string}`
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'withdraw',
      args: [shares, receiver, owner],
    });
  }

  /**
   * Transfer shares (uses encrypted balance checks)
   */
  async transfer(
    to: `0x${string}`,
    amount: bigint
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'transfer',
      args: [to, amount],
    });
  }
}

/**
 * Keeper operations (strategy management, reporting)
 */
export class VaultKeeperOperations {
  private walletClient: WalletClient;
  private address: `0x${string}`;

  constructor(walletClient: WalletClient, address: `0x${string}`) {
    this.walletClient = walletClient;
    this.address = address;
  }

  /**
   * Deploy funds to strategy (keeper only)
   */
  async deployToStrategy(
    strategy: `0x${string}`,
    amount: bigint
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'deployToStrategy',
      args: [strategy, amount],
    });
  }

  /**
   * Report strategy gains/losses (keeper only)
   * Mints donation shares to yield router for profits
   */
  async report(strategy: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'report',
      args: [strategy],
    });
  }

  /**
   * Rebalance strategy (keeper only)
   */
  async rebalanceStrategy(
    strategy: `0x${string}`,
    amount: bigint,
    isWithdraw: boolean
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateComposableVaultAbi,
      functionName: 'rebalanceStrategy',
      args: [strategy, amount, isWithdraw],
    });
  }
}

/**
 * Encrypted Strategy Registry operations
 */
export class RegistryOperations {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(
    walletClient: WalletClient,
    publicClient: PublicClient,
    address: `0x${string}`
  ) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.address = address;
  }

  // ============ Public Read Operations ============

  /**
   * Get strategy count
   */
  async getStrategyCount(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'strategyCount',
    }) as Promise<bigint>;
  }

  /**
   * Get strategy address by index
   */
  async getStrategyAddress(index: bigint): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'getStrategyAddress',
      args: [index],
    }) as Promise<`0x${string}`>;
  }

  /**
   * Check if strategy is registered
   */
  async isStrategyRegistered(strategy: `0x${string}`): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'isStrategyRegistered',
      args: [strategy],
    }) as Promise<boolean>;
  }

  // ============ Encrypted Read Operations ============

  /**
   * Get encrypted strategy weight (requires decryption)
   */
  async getEncryptedWeight(strategy: `0x${string}`): Promise<FHEHandle> {
    return this.publicClient.readContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'getWeight',
      args: [strategy],
    }) as Promise<FHEHandle>;
  }

  /**
   * Get encrypted weight sum (requires decryption)
   */
  async getEncryptedWeightSum(): Promise<FHEHandle> {
    return this.publicClient.readContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'getWeightSum',
    }) as Promise<FHEHandle>;
  }

  // ============ Write Operations (Owner Only) ============

  /**
   * Add strategy with encrypted weight
   */
  async addStrategy(
    strategy: `0x${string}`,
    encryptedWeight: EncryptedInput
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'addStrategy',
      args: [strategy, encryptedWeight],
    });
  }

  /**
   * Update strategy weight (encrypted)
   */
  async updateWeight(
    strategy: `0x${string}`,
    encryptedNewWeight: EncryptedInput
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'updateWeight',
      args: [strategy, encryptedNewWeight],
    });
  }

  /**
   * Remove strategy
   */
  async removeStrategy(strategy: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'removeStrategy',
      args: [strategy],
    });
  }

  /**
   * Set rebalancer address
   */
  async setRebalancer(rebalancer: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: EncryptedStrategyRegistryAbi,
      functionName: 'setRebalancer',
      args: [rebalancer],
    });
  }
}

/**
 * Private Rebalancer operations
 */
export class RebalancerOperations {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(
    walletClient: WalletClient,
    publicClient: PublicClient,
    address: `0x${string}`
  ) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.address = address;
  }

  // ============ Public Read Operations ============

  /**
   * Check if vault is configured
   */
  async isConfigured(vault: `0x${string}`): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateRebalancerAbi,
      functionName: 'isConfigured',
      args: [vault],
    }) as Promise<boolean>;
  }

  // ============ Encrypted Read Operations ============

  /**
   * Check if rebalancing is needed (encrypted decision)
   * Returns ebool - caller learns result but not thresholds
   */
  async checkRebalanceNeeded(
    vault: `0x${string}`,
    registry: `0x${string}`,
    currentDriftBps: bigint
  ): Promise<FHEHandle> {
    return this.publicClient.readContract({
      address: this.address,
      abi: PrivateRebalancerAbi,
      functionName: 'checkRebalanceNeeded',
      args: [vault, registry, currentDriftBps],
    }) as Promise<FHEHandle>;
  }

  // ============ Write Operations (Factory Only) ============

  /**
   * Configure vault with encrypted drift threshold and min time
   */
  async configureVault(
    vault: `0x${string}`,
    encryptedDriftThreshold: EncryptedInput,
    encryptedMinTime: EncryptedInput
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateRebalancerAbi,
      functionName: 'configureVault',
      args: [vault, encryptedDriftThreshold, encryptedMinTime],
    });
  }

  /**
   * Update drift threshold (encrypted)
   */
  async updateDriftThreshold(
    vault: `0x${string}`,
    encryptedThreshold: EncryptedInput
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateRebalancerAbi,
      functionName: 'updateDriftThreshold',
      args: [vault, encryptedThreshold],
    });
  }

  /**
   * Trigger rebalance
   */
  async triggerRebalance(
    vault: `0x${string}`,
    strategy: `0x${string}`,
    amount: bigint,
    isWithdraw: boolean
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: PrivateRebalancerAbi,
      functionName: 'triggerRebalance',
      args: [vault, strategy, amount, isWithdraw],
    });
  }
}

/**
 * Vault Factory operations
 */
export class VaultFactoryOperations {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(
    walletClient: WalletClient,
    publicClient: PublicClient,
    address: `0x${string}`
  ) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.address = address;
  }

  // ============ Public Read Operations ============

  /**
   * Get vault count
   */
  async getVaultCount(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: VaultFactoryAbi,
      functionName: 'vaultCount',
    }) as Promise<bigint>;
  }

  /**
   * Get vault at index
   */
  async getVaultAt(index: bigint): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: VaultFactoryAbi,
      functionName: 'getVaultAt',
      args: [index],
    }) as Promise<`0x${string}`>;
  }

  /**
   * Get vault registry
   */
  async getVaultRegistry(): Promise<`0x${string}`> {
    return this.publicClient.readContract({
      address: this.address,
      abi: VaultFactoryAbi,
      functionName: 'vaultRegistry',
    }) as Promise<`0x${string}`>;
  }

  // ============ Write Operations ============

  /**
   * Create new vault with encrypted parameters
   */
  async createVault(
    asset: `0x${string}`,
    name: string,
    symbol: string,
    encryptedCreatorFee: EncryptedInput,
    encryptedVaultCreatorFee: EncryptedInput
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: VaultFactoryAbi,
      functionName: 'createVault',
      args: [asset, name, symbol, encryptedCreatorFee, encryptedVaultCreatorFee],
    });
  }

  /**
   * Update default allocation mechanism
   */
  async updateDefaultAllocation(mechanism: `0x${string}`): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: VaultFactoryAbi,
      functionName: 'updateDefaultAllocation',
      args: [mechanism],
    });
  }
}

/**
 * ERC20 operations for asset interaction
 */
export class TokenOperations {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private address: `0x${string}`;

  constructor(
    walletClient: WalletClient,
    publicClient: PublicClient,
    address: `0x${string}`
  ) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.address = address;
  }

  // ============ Read Operations ============

  async getBalanceOf(account: `0x${string}`): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'balanceOf',
      args: [account],
    }) as Promise<bigint>;
  }

  async getTotalSupply(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'totalSupply',
    }) as Promise<bigint>;
  }

  async getDecimals(): Promise<number> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'decimals',
    }) as Promise<number>;
  }

  async getName(): Promise<string> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'name',
    }) as Promise<string>;
  }

  async getSymbol(): Promise<string> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'symbol',
    }) as Promise<string>;
  }

  async getAllowance(owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'allowance',
      args: [owner, spender],
    }) as Promise<bigint>;
  }

  // ============ Write Operations ============

  async approve(spender: `0x${string}`, amount: bigint): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'approve',
      args: [spender, amount],
    });
  }

  async transfer(to: `0x${string}`, amount: bigint): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'transfer',
      args: [to, amount],
    });
  }

  async transferFrom(from: `0x${string}`, to: `0x${string}`, amount: bigint): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: MockERC20Abi,
      functionName: 'transferFrom',
      args: [from, to, amount],
    });
  }
}

// Export all classes
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
};

// Re-export types
export type { CoFHEConfig, EncryptedInput, FHEHandle };