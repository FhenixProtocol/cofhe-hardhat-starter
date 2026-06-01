// Contract ABIs for CoFHE Protocol
// These are loaded from deployed contracts on Arbitrum

import PrivateComposableVaultAbi from './PrivateComposableVault.json';
import EncryptedStrategyRegistryAbi from './EncryptedStrategyRegistry.json';
import VaultFactoryAbi from './VaultFactory.json';

export {
  PrivateComposableVaultAbi,
  EncryptedStrategyRegistryAbi,
  VaultFactoryAbi,
};

export const CONTRACT_ADDRESSES = {
  VAULT_FACTORY: "0x0000000000000000000000000000000000000001",
  PRIVATE_COMPOSABLE_VAULT: "0x0000000000000000000000000000000000000002",
  ENCRYPTED_STRATEGY_REGISTRY: "0x0000000000000000000000000000000000000003",
} as const;
