// Auto-generated types for MockAavePool
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type ATokenResult = {
  result0: string
};

export type AssetResult = {
  result0: string
};

export type GetATokenBalanceParams = {
  account: string
};

export type GetATokenBalanceResult = {
  result0: bigint
};

export type GetReserveDataParams = {
  param0: string
};

export type GetReserveDataResult = {
  result0: { configuration: bigint; liquidityIndex: uint128; currentLiquidityRate: uint128; variableBorrowIndex: uint128; currentVariableBorrowRate: uint128; currentStableBorrowRate: uint128; lastUpdateTimestamp: uint40; id: bigint; aTokenAddress: string; stableDebtTokenAddress: string; variableDebtTokenAddress: string; interestRateStrategyAddress: string; accruedToTreasury: uint128; unbacked: uint128; isolationModeTotalDebt: uint128 }
};

export type GetReserveNormalizedIncomeParams = {
  param0: string
};

export type GetReserveNormalizedIncomeResult = {
  result0: bigint
};

export type NormalizedIncomeResult = {
  result0: bigint
};

export type SetNormalizedIncomeParams = {
  _normalizedIncome: bigint
};

export type SupplyParams = {
  _asset: string,
  amount: bigint,
  onBehalfOf: string,
  param3: bigint
};

export type WithdrawParams = {
  _asset: string,
  amount: bigint,
  to: string
};

export type WithdrawResult = {
  result0: bigint
};

// Contract function names
export const MockAavePoolFunctions = {
  aToken: 'aToken',
  asset: 'asset',
  getATokenBalance: 'getATokenBalance',
  getReserveData: 'getReserveData',
  getReserveNormalizedIncome: 'getReserveNormalizedIncome',
  normalizedIncome: 'normalizedIncome',
  setNormalizedIncome: 'setNormalizedIncome',
  supply: 'supply',
  withdraw: 'withdraw',
} as const;

// Function metadata
export interface MockAavePoolMetadata {
  'aToken': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'asset': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'getATokenBalance': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'getReserveData': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'getReserveNormalizedIncome': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'normalizedIncome': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'setNormalizedIncome': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'supply': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 4,
    outputs: 0,
  },
  'withdraw': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 1,
  },
};