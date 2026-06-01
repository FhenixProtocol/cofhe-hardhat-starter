// Auto-generated types for VaultFactory
// This file provides TypeScript type definitions for contract interactions

import { InferouseType } from 'viem';

// Function input types
export type CreateVaultParams = {
  params: { asset: string; name: string; symbol: string; donationAddress: string; allocationMechanismType: bigint; initialRecipients: address[]; initialWeights: uint256[]; votingCandidates: address[]; votingEpochDuration: bigint; vaultCreatorFeeEncrypted: Record<string, unknown>; driftThresholdEncrypted: Record<string, unknown>; minTimeBetweenRebalancesEncrypted: Record<string, unknown>; keeper: string; emergencyAdmin: string; maxStrategies: bigint }
};

export type CreateVaultResult = {
  deployed: { vault: string; registry: string; rebalancer: string; disclosureModule: string; yieldRouter: string; allocationMechanism: string }
};

export type MechanismFactoryResult = {
  result0: string
};

export type RebalancerContractResult = {
  result0: string
};

export type VaultRegistryResult = {
  result0: string
};

// Contract function names
export const VaultFactoryFunctions = {
  createVault: 'createVault',
  mechanismFactory: 'mechanismFactory',
  rebalancerContract: 'rebalancerContract',
  vaultRegistry: 'vaultRegistry',
} as const;

// Function metadata
export interface VaultFactoryMetadata {
  'createVault': {
    type: 'nonpayable',
    isWrite: true,
    inputs: 1,
    outputs: 1,
  },
  'mechanismFactory': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'rebalancerContract': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
  'vaultRegistry': {
    type: 'view',
    inputs: 0,
    outputs: 1,
  },
};