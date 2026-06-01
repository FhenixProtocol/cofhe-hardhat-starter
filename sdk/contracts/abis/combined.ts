// Combined ABI exports for all contracts
import { default as PrivateComposableVaultAbi } from './PrivateComposableVault.json';
import { default as EncryptedStrategyRegistryAbi } from './EncryptedStrategyRegistry.json';
import { default as PrivateRebalancerAbi } from './PrivateRebalancer.json';
import { default as YieldRouterAbi } from './YieldRouter.json';
import { default as MockStrategyAbi } from './MockStrategy.json';
import { default as MockAavePoolAbi } from './MockAavePool.json';
import { default as FixedAllocationMechanismAbi } from './FixedAllocationMechanism.json';
import { default as VaultFactoryAbi } from './VaultFactory.json';
import { default as MockERC20Abi } from './MockERC20.json';
import { default as CounterAbi } from './Counter.json';

export {
  PrivateComposableVaultAbi,
  EncryptedStrategyRegistryAbi,
  PrivateRebalancerAbi,
  YieldRouterAbi,
  MockStrategyAbi,
  MockAavePoolAbi,
  FixedAllocationMechanismAbi,
  VaultFactoryAbi,
  MockERC20Abi,
  CounterAbi,
};

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  42161: { // Arbitrum Mainnet
    PrivateComposableVault: 'TBD',
    EncryptedStrategyRegistry: 'TBD',
    PrivateRebalancer: 'TBD',
    YieldRouter: 'TBD',
    VaultFactory: 'TBD',
  },
  421614: { // Arbitrum Sepolia
    PrivateComposableVault: 'TBD',
    EncryptedStrategyRegistry: 'TBD',
    PrivateRebalancer: 'TBD',
    YieldRouter: 'TBD',
    VaultFactory: 'TBD',
  },
  31337: { // Local Hardhat
    PrivateComposableVault: 'TBD',
    EncryptedStrategyRegistry: 'TBD',
    PrivateRebalancer: 'TBD',
    YieldRouter: 'TBD',
    VaultFactory: 'TBD',
  },
} as const;
