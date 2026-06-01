// Auto-generated types for MockStrategy
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type AssetResult = {
  result0: string
};

export type DeployFundsParams = {
  amount: bigint
};

export type DeployedAmountResult = {
  result0: bigint
};

export type EmergencyAdminResult = {
  result0: string
};

export type FreeFundsParams = {
  amount: bigint
};

export type HarvestAndReportResult = {
  result0: bigint
};

export type IsActiveResult = {
  result0: boolean
};

export type KeeperResult = {
  result0: string
};

export type ManagementResult = {
  result0: string
};

export type MockTotalAssetsResult = {
  result0: bigint
};

export type SetMockTotalAssetsParams = {
  amount: bigint
};

export type TotalAssetsResult = {
  result0: bigint
};

export type VaultResult = {
  result0: string
};

// Contract function names
export const MockStrategyFunctions = {
  asset: 'asset',
  deployFunds: 'deployFunds',
  deployedAmount: 'deployedAmount',
  emergencyAdmin: 'emergencyAdmin',
  freeFunds: 'freeFunds',
  harvestAndReport: 'harvestAndReport',
  isActive: 'isActive',
  keeper: 'keeper',
  management: 'management',
  mockTotalAssets: 'mockTotalAssets',
  setMockTotalAssets: 'setMockTotalAssets',
  totalAssets: 'totalAssets',
  vault: 'vault',
} as const;

// Function metadata
export interface MockStrategyMetadata {
  'asset': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'deployFunds': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'deployedAmount': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'emergencyAdmin': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'freeFunds': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'harvestAndReport': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 1,
  },
  'isActive': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'keeper': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'management': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'mockTotalAssets': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'setMockTotalAssets': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'totalAssets': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'vault': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
};