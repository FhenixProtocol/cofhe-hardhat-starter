import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@cofhe/hardhat-plugin";
import * as dotenv from "dotenv";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  cofhe: {
    logMocks: true,
    gasWarning: true,
  },
  solidity: {
    version: "0.8.26",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  // defaultNetwork: 'localcofhe',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    // localcofhe, eth-sepolia, and arb-sepolia are auto-injected by @cofhe/hardhat-plugin

    // Base Sepolia testnet configuration (not provided by plugin)
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasMultiplier: 1.2,
      timeout: 60000,
      httpHeaders: {},
    },
    "base-fork": {
      url: "https://base-mainnet.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO",
      chainId: 8453,
      forking: {
        url: "https://base-mainnet.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO",
      },
    },
    "arb-fork": {
      url: "https://arb-mainnet.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO",
      chainId: 42161,
      forking: {
        url: "https://arb-mainnet.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO",
      },
    },
  },

  etherscan: {
    apiKey: {
      "eth-sepolia": process.env.ETHERSCAN_API_KEY || "",
      "arb-sepolia": process.env.ARBISCAN_API_KEY || "",
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
    },
  },
};

export default config;
