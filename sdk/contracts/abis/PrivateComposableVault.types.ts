// Auto-generated types for PrivateComposableVault
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type MAX_BPSResult = {
  result0: bigint
};

export type AddStrategyParams = {
  strategy: string
};

export type AllowanceParams = {
  owner: string,
  spender: string
};

export type AllowanceResult = {
  result0: bigint
};

export type ApproveParams = {
  spender: string,
  value: bigint
};

export type ApproveResult = {
  result0: boolean
};

export type AssetResult = {
  result0: string
};

export type BalanceOfParams = {
  account: string
};

export type BalanceOfResult = {
  result0: bigint
};

export type ConvertToAssetsParams = {
  shares: bigint
};

export type ConvertToAssetsResult = {
  result0: bigint
};

export type ConvertToSharesParams = {
  assets: bigint
};

export type ConvertToSharesResult = {
  result0: bigint
};

export type DecimalsResult = {
  result0: bigint
};

export type DeployToStrategyParams = {
  strategy: string,
  amount: bigint
};

export type DepositParams = {
  assets: bigint,
  receiver: string
};

export type DepositResult = {
  result0: bigint
};

export type DepositsPausedResult = {
  result0: boolean
};

export type DonationAddressResult = {
  result0: string
};

export type EmergencyAdminResult = {
  result0: string
};

export type GetCreatorFeeResult = {
  result0: string
};

export type InitializeParams = {
  _registry: string,
  _yieldRouter: string,
  _rebalancer: string
};

export type KeeperResult = {
  result0: string
};

export type MaxDepositParams = {
  param0: string
};

export type MaxDepositResult = {
  result0: bigint
};

export type MaxMintParams = {
  param0: string
};

export type MaxMintResult = {
  result0: bigint
};

export type MaxRedeemParams = {
  owner: string
};

export type MaxRedeemResult = {
  result0: bigint
};

export type MaxWithdrawParams = {
  owner: string
};

export type MaxWithdrawResult = {
  result0: bigint
};

export type MintParams = {
  shares: bigint,
  receiver: string
};

export type MintResult = {
  result0: bigint
};

export type NameResult = {
  result0: string
};

export type OwnerResult = {
  result0: string
};

export type PreviewDepositParams = {
  assets: bigint
};

export type PreviewDepositResult = {
  result0: bigint
};

export type PreviewMintParams = {
  shares: bigint
};

export type PreviewMintResult = {
  result0: bigint
};

export type PreviewRedeemParams = {
  shares: bigint
};

export type PreviewRedeemResult = {
  result0: bigint
};

export type PreviewWithdrawParams = {
  assets: bigint
};

export type PreviewWithdrawResult = {
  result0: bigint
};

export type PricePerShareResult = {
  result0: bigint
};

export type RebalanceStrategyParams = {
  strategy: string,
  amount: bigint,
  isWithdraw: boolean
};

export type RebalancerResult = {
  result0: string
};

export type RedeemParams = {
  shares: bigint,
  receiver: string,
  owner: string
};

export type RedeemResult = {
  result0: bigint
};

export type RegistryResult = {
  result0: string
};

export type ReportParams = {
  strategy: string
};

export type StrategyCountResult = {
  result0: bigint
};

export type StrategyDebtParams = {
  param0: string
};

export type StrategyDebtResult = {
  result0: bigint
};

export type SymbolResult = {
  result0: string
};

export type TotalAssetsResult = {
  result0: bigint
};

export type TotalPrincipalResult = {
  result0: bigint
};

export type TotalSupplyResult = {
  result0: bigint
};

export type TransferParams = {
  to: string,
  value: bigint
};

export type TransferResult = {
  result0: boolean
};

export type TransferFromParams = {
  from: string,
  to: string,
  value: bigint
};

export type TransferFromResult = {
  result0: boolean
};

export type WithdrawParams = {
  assets: bigint,
  receiver: string,
  owner: string
};

export type WithdrawResult = {
  result0: bigint
};

export type WithdrawFromStrategyParams = {
  strategy: string,
  amount: bigint
};

export type WithdrawalsPausedResult = {
  result0: boolean
};

export type YieldRouterResult = {
  result0: string
};

// Contract function names
export const PrivateComposableVaultFunctions = {
  MAX_BPS: 'MAX_BPS',
  addStrategy: 'addStrategy',
  allowance: 'allowance',
  approve: 'approve',
  asset: 'asset',
  balanceOf: 'balanceOf',
  convertToAssets: 'convertToAssets',
  convertToShares: 'convertToShares',
  decimals: 'decimals',
  deployToStrategy: 'deployToStrategy',
  deposit: 'deposit',
  depositsPaused: 'depositsPaused',
  donationAddress: 'donationAddress',
  emergencyAdmin: 'emergencyAdmin',
  getCreatorFee: 'getCreatorFee',
  initialize: 'initialize',
  keeper: 'keeper',
  maxDeposit: 'maxDeposit',
  maxMint: 'maxMint',
  maxRedeem: 'maxRedeem',
  maxWithdraw: 'maxWithdraw',
  mint: 'mint',
  name: 'name',
  owner: 'owner',
  pauseDeposits: 'pauseDeposits',
  pauseWithdrawals: 'pauseWithdrawals',
  previewDeposit: 'previewDeposit',
  previewMint: 'previewMint',
  previewRedeem: 'previewRedeem',
  previewWithdraw: 'previewWithdraw',
  pricePerShare: 'pricePerShare',
  rebalanceStrategy: 'rebalanceStrategy',
  rebalancer: 'rebalancer',
  redeem: 'redeem',
  registry: 'registry',
  report: 'report',
  strategyCount: 'strategyCount',
  strategyDebt: 'strategyDebt',
  symbol: 'symbol',
  totalAssets: 'totalAssets',
  totalPrincipal: 'totalPrincipal',
  totalSupply: 'totalSupply',
  transfer: 'transfer',
  transferFrom: 'transferFrom',
  unpauseDeposits: 'unpauseDeposits',
  unpauseWithdrawals: 'unpauseWithdrawals',
  withdraw: 'withdraw',
  withdrawFromStrategy: 'withdrawFromStrategy',
  withdrawalsPaused: 'withdrawalsPaused',
  yieldRouter: 'yieldRouter',
} as const;

// Function metadata
export interface PrivateComposableVaultMetadata {
  'MAX_BPS': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'addStrategy': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'allowance': {
    type: 'view',
    inputs: 2,
    outputs: 1,
  },
  'approve': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 1,
  },
  'asset': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'balanceOf': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'convertToAssets': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'convertToShares': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'decimals': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'deployToStrategy': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
  'deposit': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 1,
  },
  'depositsPaused': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'donationAddress': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'emergencyAdmin': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'getCreatorFee': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 1,
  },
  'initialize': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 0,
  },
  'keeper': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'maxDeposit': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'maxMint': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'maxRedeem': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'maxWithdraw': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'mint': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 1,
  },
  'name': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'owner': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'pauseDeposits': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'pauseWithdrawals': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'previewDeposit': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'previewMint': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'previewRedeem': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'previewWithdraw': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'pricePerShare': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'rebalanceStrategy': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 0,
  },
  'rebalancer': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'redeem': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 1,
  },
  'registry': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'report': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'strategyCount': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'strategyDebt': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'symbol': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'totalAssets': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'totalPrincipal': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'totalSupply': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'transfer': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 1,
  },
  'transferFrom': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 1,
  },
  'unpauseDeposits': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'unpauseWithdrawals': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'withdraw': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 1,
  },
  'withdrawFromStrategy': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
  'withdrawalsPaused': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'yieldRouter': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
};