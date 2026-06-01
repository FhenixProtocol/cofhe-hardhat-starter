// Auto-generated types for FixedAllocationMechanism
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type EpochDurationResult = {
  result0: bigint
};

export type GetRecipientsResult = {
  result0: address[],
  result1: uint256[]
};

export type OwnerResult = {
  result0: string
};

export type TotalWeightResult = {
  result0: bigint
};

export type UpdateRecipientsParams = {
  recipients: address[],
  weights: uint256[]
};

// Contract function names
export const FixedAllocationMechanismFunctions = {
  epochDuration: 'epochDuration',
  getRecipients: 'getRecipients',
  owner: 'owner',
  totalWeight: 'totalWeight',
  updateRecipients: 'updateRecipients',
} as const;

// Function metadata
export interface FixedAllocationMechanismMetadata {
  'epochDuration': {
    type: 'pure',
    inputs: 0,
    outputs: 1,
  },
  'getRecipients': {
    type: 'view',
    inputs: 0,
    outputs: 2,
  },
  'owner': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'totalWeight': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'updateRecipients': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
};