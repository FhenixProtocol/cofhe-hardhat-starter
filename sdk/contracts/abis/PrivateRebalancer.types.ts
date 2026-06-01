// Auto-generated types for PrivateRebalancer
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type CheckRebalanceNeededParams = {
  vault: string,
  param1: string,
  currentDriftBps: bigint
};

export type CheckRebalanceNeededResult = {
  result0: string
};

export type ConfigureVaultParams = {
  vault: string,
  encDriftThreshold: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string },
  encMinTime: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

export type FactoryResult = {
  result0: string
};

export type IsConfiguredParams = {
  param0: string
};

export type IsConfiguredResult = {
  result0: boolean
};

export type TriggerRebalanceParams = {
  vault: string,
  param1: string,
  strategies: address[],
  amounts: uint128[],
  isWithdraw: bool[],
  currentDriftBps: bigint
};

export type UpdateDriftThresholdParams = {
  vault: string,
  encThreshold: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

export type UpdateMinTimeParams = {
  vault: string,
  encMinTime: { ctHash: bigint; securityZone: bigint; utype: bigint; signature: string }
};

// Contract function names
export const PrivateRebalancerFunctions = {
  checkRebalanceNeeded: 'checkRebalanceNeeded',
  configureVault: 'configureVault',
  factory: 'factory',
  isConfigured: 'isConfigured',
  triggerRebalance: 'triggerRebalance',
  updateDriftThreshold: 'updateDriftThreshold',
  updateMinTime: 'updateMinTime',
} as const;

// Function metadata
export interface PrivateRebalancerMetadata {
  'checkRebalanceNeeded': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 3,
    outputs: 1,
  },
  'configureVault': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 3,
    outputs: 0,
  },
  'factory': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'isConfigured': {
    type: 'view',
    inputs: 1,
    outputs: 1,
  },
  'triggerRebalance': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 6,
    outputs: 0,
  },
  'updateDriftThreshold': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 2,
    outputs: 0,
  },
  'updateMinTime': {
    type: 'nonpayable',
    isWrite: true,
    hasEncryptedInputs: true,
    inputs: 2,
    outputs: 0,
  },
};