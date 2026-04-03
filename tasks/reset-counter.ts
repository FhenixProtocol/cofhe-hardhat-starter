import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Counter } from '../typechain-types'
import { Encryptable } from '@cofhe/sdk'
import { getDeployment, createCofheClient } from './utils'

// Task to reset the counter with an encrypted input
task('reset-counter', 'reset the counter').setAction(async (_, hre: HardhatRuntimeEnvironment) => {
	const { ethers, network } = hre

	// Get the Counter contract address
	const counterAddress = getDeployment(network.name, 'Counter')
	if (!counterAddress) {
		console.error(`No Counter deployment found for network ${network.name}`)
		console.error(`Please deploy first using: npx hardhat deploy-counter --network ${network.name}`)
		return
	}

	console.log(`Using Counter at ${counterAddress} on ${network.name}`)

	// Get the signer and create cofhe client
	const [signer] = await ethers.getSigners()
	console.log(`Using account: ${signer.address}`)
	const client = await createCofheClient(hre, signer)

	// Get the contract instance with proper typing
	const Counter = await ethers.getContractFactory('Counter')
	const counter = Counter.attach(counterAddress) as unknown as Counter

	const encrypted = await client.encryptInputs([Encryptable.uint32(2000n)]).execute()

	console.log('Resetting counter...')
	const tx = await counter.reset(encrypted[0])
	await tx.wait()
	console.log(`Transaction hash: ${tx.hash}`)

	// Get new count
	const newCount = await counter.count()
	console.log(`New count: ${newCount}`)
})
