// Auto-generated types for Counter
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type ONEResult = {
  result0: string
};

export type CountResult = {
  result0: string
};

export type GetDecryptedValueResult = {
  result0: bigint
};

export type IsInitializedResult = {
  result0: string
};

export type ResetParams = {
  value: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

export type RevealCounterParams = {
  plaintext: bigint,
  signature: string
};

// Contract function names
export const CounterFunctions = {
  ONE: 'ONE',
  allowCounterPublicly: 'allowCounterPublicly',
  count: 'count',
  decrement: 'decrement',
  getDecryptedValue: 'getDecryptedValue',
  increment: 'increment',
  isInitialized: 'isInitialized',
  reset: 'reset',
  revealCounter: 'revealCounter',
} as const;

// Function metadata
export interface CounterMetadata {
  'ONE': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'allowCounterPublicly': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'count': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'decrement': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'getDecryptedValue': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'increment': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 0,
    outputs: 0,
  },
  'isInitialized': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'reset': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 1,
    outputs: 0,
  },
  'revealCounter': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 2,
    outputs: 0,
  },
};