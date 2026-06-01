// Auto-generated types for MockERC20
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
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

export type BalanceOfParams = {
  account: string
};

export type BalanceOfResult = {
  result0: bigint
};

export type BurnParams = {
  from: string,
  amount: bigint
};

export type DecimalsResult = {
  result0: bigint
};

export type MintParams = {
  to: string,
  amount: bigint
};

export type NameResult = {
  result0: string
};

export type SymbolResult = {
  result0: string
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

// Contract function names
export const MockERC20Functions = {
  allowance: 'allowance',
  approve: 'approve',
  balanceOf: 'balanceOf',
  burn: 'burn',
  decimals: 'decimals',
  mint: 'mint',
  name: 'name',
  symbol: 'symbol',
  totalSupply: 'totalSupply',
  transfer: 'transfer',
  transferFrom: 'transferFrom',
} as const;

// Function metadata
export interface MockERC20Metadata {
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
  'balanceOf': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'burn': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
  'decimals': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'mint': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
  'name': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'symbol': {
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
};