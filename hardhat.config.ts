import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@cofhe/hardhat-plugin";
import * as dotenv from "dotenv";
import "./tasks";

dotenv.config();

const {
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  ARBITRUM_SEPOLIA_RPC_URL,
  BASE_SEPOLIA_RPC_URL,
  ETHERSCAN_API_KEY,
  ARBISCAN_API_KEY,
  BASESCAN_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
  cofhe: {
    logMocks: true,
    gasWarning: true,
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
    },
  },
  defaultNetwork: "hardhat",
  // defaultNetwork: 'localcofhe',
  networks: {
    // localcofhe, eth-sepolia, and arb-sepolia are auto-injected by @cofhe/hardhat-plugin
    // Sepolia testnet configuration
    "eth-sepolia": {
      url:
        SEPOLIA_RPC_URL ||
        "https://ethereum-sepolia.publicnode.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasMultiplier: 1.2,
      timeout: 60000,
      httpHeaders: {},
    },
    // Arbitrum Sepolia testnet configuration
    "arb-sepolia": {
      url:
        ARBITRUM_SEPOLIA_RPC_URL ||
        "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 421614,
      gasMultiplier: 1.2,
      timeout: 60000,
      httpHeaders: {},
    },
    // Base Sepolia testnet configuration (not provided by plugin)
    "base-sepolia": {
      url: BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
      gasMultiplier: 1.2,
      timeout: 60000,
      httpHeaders: {},
    },
  },

  etherscan: {
    apiKey: {
      "eth-sepolia": ETHERSCAN_API_KEY || "",
      "arb-sepolia": ARBISCAN_API_KEY || "",
      "base-sepolia": BASESCAN_API_KEY || "",
    },
  },
};

export default config;
