/**
 * CoFHE Protocol - Contract Configuration
 */

// Contract addresses by network
export const CONTRACTS = {
  42161: { // Arbitrum Mainnet
    vaultFactory: '0x0000000000000000000000000000000000000001' as const,
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
    aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const,
    uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as const,
    uniswapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const,
  },
  421614: { // Arbitrum Sepolia
    vaultFactory: '0x0000000000000000000000000000000000000001' as const,
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
    aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const,
  },
} as const;

// ERC20 Token Addresses (Arbitrum)
export const TOKENS = {
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
  WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
  WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aEF5C784' as const,
  DAI: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490' as const,
} as const;