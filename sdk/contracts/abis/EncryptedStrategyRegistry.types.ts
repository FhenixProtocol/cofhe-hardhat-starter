// Auto-generated types for EncryptedStrategyRegistry
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type AddStrategyParams = {
  strategy: string,
  encWeight: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

export type AllowAuditorParams = {
  auditor: string
};

export type FactoryResult = {
  result0: string
};

export type GetActiveParams = {
  strategy: string
};

export type GetActiveResult = {
  result0: string
};

export type GetAllStrategyAddressesResult = {
  addrs: address[]
};

export type GetStrategyAddressParams = {
  index: bigint
};

export type GetStrategyAddressResult = {
  result0: string
};

export type GetTotalDebtParams = {
  strategy: string
};

export type GetTotalDebtResult = {
  result0: string
};

export type GetWeightParams = {
  strategy: string
};

export type GetWeightResult = {
  result0: string
};

export type GetWeightSumResult = {
  result0: string
};

export type IsStrategyRegisteredParams = {
  strategy: string
};

export type IsStrategyRegisteredResult = {
  result0: boolean
};

export type MaxStrategiesResult = {
  result0: bigint
};

export type OwnerResult = {
  result0: string
};

export type RebalancerResult = {
  result0: string
};

export type RemoveStrategyParams = {
  strategy: string
};

export type SetRebalancerParams = {
  _rebalancer: string
};

export type SetTotalDebtParams = {
  strategy: string,
  plainDebt: uint128
};

export type StrategyCountResult = {
  result0: bigint
};

export type UpdateWeightParams = {
  strategy: string,
  encNewWeight: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

export type VaultResult = {
  result0: string
};

// Contract function names
export const EncryptedStrategyRegistryFunctions = {
  addStrategy: 'addStrategy',
  allowAuditor: 'allowAuditor',
  factory: 'factory',
  getActive: 'getActive',
  getAllStrategyAddresses: 'getAllStrategyAddresses',
  getStrategyAddress: 'getStrategyAddress',
  getTotalDebt: 'getTotalDebt',
  getWeight: 'getWeight',
  getWeightSum: 'getWeightSum',
  isStrategyRegistered: 'isStrategyRegistered',
  maxStrategies: 'maxStrategies',
  owner: 'owner',
  rebalancer: 'rebalancer',
  removeStrategy: 'removeStrategy',
  setRebalancer: 'setRebalancer',
  setTotalDebt: 'setTotalDebt',
  strategyCount: 'strategyCount',
  updateWeight: 'updateWeight',
  vault: 'vault',
} as const;

// Function metadata
export interface EncryptedStrategyRegistryMetadata {
  'addStrategy': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 2,
    outputs: 0,
  },
  'allowAuditor': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'factory': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'getActive': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 1,
  },
  'getAllStrategyAddresses': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'getStrategyAddress': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'getTotalDebt': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 1,
  },
  'getWeight': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 1,
  },
  'getWeightSum': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 1,
  },
  'isStrategyRegistered': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'maxStrategies': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'owner': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'rebalancer': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'removeStrategy': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'setRebalancer': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'setTotalDebt': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
  'strategyCount': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'updateWeight': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 2,
    outputs: 0,
  },
  'vault': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
};