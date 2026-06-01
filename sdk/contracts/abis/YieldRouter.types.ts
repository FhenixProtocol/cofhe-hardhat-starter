// Auto-generated types for YieldRouter
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type AllocationMechanismResult = {
  result0: string
};

export type ClaimParams = {
  epoch: bigint
};

export type ClaimableParams = {
  param0: bigint,
  param1: string
};

export type ClaimableResult = {
  result0: bigint
};

export type ClaimableForParams = {
  recipient: string,
  epoch: bigint
};

export type ClaimableForResult = {
  result0: bigint
};

export type CurrentEpochResult = {
  result0: bigint
};

export type RouteYieldParams = {
  sharesToRoute: bigint
};

export type TotalRoutedSharesResult = {
  result0: bigint
};

export type VaultResult = {
  result0: string
};

// Contract function names
export const YieldRouterFunctions = {
  advanceEpoch: 'advanceEpoch',
  allocationMechanism: 'allocationMechanism',
  claim: 'claim',
  claimable: 'claimable',
  claimableFor: 'claimableFor',
  currentEpoch: 'currentEpoch',
  routeYield: 'routeYield',
  totalRoutedShares: 'totalRoutedShares',
  vault: 'vault',
} as const;

// Function metadata
export interface YieldRouterMetadata {
  'advanceEpoch': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'allocationMechanism': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'claim': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'claimable': {
    type: 'view',
    inputs: 2,
    outputs: 1,
  },
  'claimableFor': {
    type: 'view',
    inputs: 2,
    outputs: 1,
  },
  'currentEpoch': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'routeYield': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 0,
  },
  'totalRoutedShares': {
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