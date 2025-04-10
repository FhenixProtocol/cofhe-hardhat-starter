import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-ethers'
import 'cofhe-hardhat-plugin'
import * as dotenv from 'dotenv'
import './tasks'

dotenv.config()

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.25',
		settings: {
			evmVersion: 'cancun',
		},
	},
	defaultNetwork: 'hardhat',
	// defaultNetwork: 'localcofhe',
	networks: {
		// The plugin already provides localcofhe configuration

		// Sepolia testnet configuration
		'eth-sepolia': {
			url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 11155111,
			gasMultiplier: 1.2,
			timeout: 60000,
			httpHeaders: {},
		},

		// Arbitrum Sepolia testnet configuration
		'arb-sepolia': {
			url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 421614,
			gasMultiplier: 1.2,
			timeout: 60000,
			httpHeaders: {},
		},
	},

	// Optional: Add Etherscan verification config
	etherscan: {
		apiKey: {
			'eth-sepolia': process.env.ETHERSCAN_API_KEY || '',
			'arb-sepolia': process.env.ARBISCAN_API_KEY || '',
		},
	},
}

export default config
