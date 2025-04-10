import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'
import { cofhejs, Encryptable, EncryptStep, FheTypes } from 'cofhejs/node'
import { expect } from 'chai'
import { localcofheFundWalletIfNeeded } from 'cofhe-hardhat-plugin'

describe('Counter', function () {
	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async function deployCounterFixture() {
		// Contracts are deployed using the first signer/account by default
		const [signer, signer2, bob, alice] = await hre.ethers.getSigners()

		const Counter = await hre.ethers.getContractFactory('Counter')
		const counter = await Counter.connect(bob).deploy()

		return { counter, signer, bob, alice }
	}

	describe('Functionality', function () {
		beforeEach(function () {
			if (!hre.cofhe.isPermittedEnvironment('MOCK')) this.skip()
			// mock_setLoggingEnabled(hre, true)
		})

		afterEach(function () {
			if (!hre.cofhe.isPermittedEnvironment('MOCK')) return
			// mock_setLoggingEnabled(hre, false)
		})

		it('Should increment the counter', async function () {
			const { counter, bob } = await loadFixture(deployCounterFixture)
			const count = await counter.count()
			await hre.cofhe.mocks.expectPlaintext(count, 0n)

			await hre.cofhe.mocks.withLogs('counter.increment()', async () => {
				await counter.connect(bob).increment()
			})

			const count2 = await counter.count()
			await hre.cofhe.mocks.expectPlaintext(count2, 1n)
		})
		it('cofhejs unseal (mocks)', async function () {
			await hre.cofhe.mocks.enableLogs('cofhejs unseal (mocks)')
			const { counter, bob } = await loadFixture(deployCounterFixture)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bob))

			const count = await counter.count()
			const unsealedResult = await cofhejs.unseal(count, FheTypes.Uint32)
			console.log('unsealedResult', unsealedResult)
			await hre.cofhe.expectResultValue(unsealedResult, 0n)

			await counter.connect(bob).increment()

			const count2 = await counter.count()
			const unsealedResult2 = await cofhejs.unseal(count2, FheTypes.Uint32)
			await hre.cofhe.expectResultValue(unsealedResult2, 1n)

			await hre.cofhe.mocks.disableLogs()
		})
		it('cofhejs encrypt (mocks)', async function () {
			const { counter, bob } = await loadFixture(deployCounterFixture)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bob))

			const setState = (step: EncryptStep) => {
				console.log(`Encrypt step - ${step}`)
			}

			const [encryptedInput] = await hre.cofhe.expectResultSuccess(cofhejs.encrypt(setState, [Encryptable.uint32(5n)] as const))
			await hre.cofhe.mocks.expectPlaintext(encryptedInput.ctHash, 5n)

			await counter.connect(bob).reset(encryptedInput)

			const count = await counter.count()
			await hre.cofhe.mocks.expectPlaintext(count, 5n)

			const unsealedResult = await cofhejs.unseal(count, FheTypes.Uint32)
			await hre.cofhe.expectResultValue(unsealedResult, 5n)
		})
	})

	describe('Functionality (localcofhe)', function () {
		beforeEach(async function () {
			if (!hre.cofhe.isPermittedEnvironment('LOCAL')) this.skip()

			const [signer, signer2, bob, alice] = await hre.ethers.getSigners()
			await localcofheFundWalletIfNeeded(hre, bob.address)
		})

		it('Should increment the counter & unseal (localcofhe)', async function () {
			const { counter, bob } = await deployCounterFixture()
			await hre.cofhe.expectResultSuccess(await hre.cofhe.initializeWithHardhatSigner(bob))

			await counter.connect(bob).increment()
			let count = await counter.count()
			const unsealedResult = await cofhejs.unseal(count, FheTypes.Uint32)

			await hre.cofhe.expectResultValue(unsealedResult, 1n)
		})

		it('cofhejs encrypt & decrypt (localcofhe)', async function () {
			const { counter, bob } = await deployCounterFixture()

			await hre.cofhe.expectResultSuccess(await hre.cofhe.initializeWithHardhatSigner(bob))

			const setState = (step: EncryptStep) => {
				console.log(`Encrypt step - ${step}`)
			}

			const [encryptedInput] = await hre.cofhe.expectResultSuccess(await cofhejs.encrypt(setState, [Encryptable.uint32(5n)] as const))

			await counter.connect(bob).reset(encryptedInput)

			const count = await counter.count()
			const decryptedResult = await cofhejs.decrypt(count, FheTypes.Uint32)
			console.log('decryptedResult', decryptedResult)
			await hre.cofhe.expectResultValue(decryptedResult, 5n)
		})

		it('On-chain decrypt (localcofhe)', async function () {
			const { counter, bob } = await deployCounterFixture()

			await hre.cofhe.expectResultSuccess(await hre.cofhe.initializeWithHardhatSigner(bob))

			await counter.connect(bob).increment()
			await counter.connect(bob).increment()
			await counter.connect(bob).increment()

			await counter.connect(bob).decryptCounter()

			let maxAttempts = 10
			let count = 0n
			while (maxAttempts > 0) {
				try {
					count = await counter.connect(bob).getDecryptedValue()
					maxAttempts = 0
				} catch (error) {
					console.error('Error', error)
				}
				maxAttempts--
				await sleep(1000)
			}

			expect(count).equal(3n)
		})
	})
})
