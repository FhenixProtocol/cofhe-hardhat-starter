# Fhenix CoFHE Hardhat Starter

This project is a starter repository for developing FHE (Fully Homomorphic Encryption) smart contracts on the Fhenix network using CoFHE (Confidential Computing Framework for Homomorphic Encryption).

## Prerequisites

- Node.js (v18 or later)
- pnpm (recommended package manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/fhenixprotocol/cofhe-hardhat-starter.git
cd cofhe-hardhat-starter
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs for testnet usage
```

## Available Scripts

### Development

- `pnpm compile` - Compile the smart contracts
- `pnpm clean` - Clean the project artifacts
- `pnpm test` - Run tests on the Hardhat network (mock FHE)

### Local CoFHE Network

- `pnpm localcofhe:start` - Start a local CoFHE network
- `pnpm localcofhe:stop` - Stop the local CoFHE network
- `pnpm localcofhe:test` - Run tests on the local CoFHE network
- `pnpm localcofhe:faucet` - Get test tokens from the faucet
- `pnpm localcofhe:deploy` - Deploy contracts to the local CoFHE network

### Testnet Deployment & Interaction

Each supported testnet has deploy, increment, and reset tasks:

**Ethereum Sepolia:**
- `pnpm eth-sepolia:deploy-counter` - Deploy the Counter contract
- `pnpm eth-sepolia:increment-counter` - Increment the counter
- `pnpm eth-sepolia:reset-counter` - Reset the counter with an encrypted value

**Arbitrum Sepolia:**
- `pnpm arb-sepolia:deploy-counter` - Deploy the Counter contract
- `pnpm arb-sepolia:increment-counter` - Increment the counter
- `pnpm arb-sepolia:reset-counter` - Reset the counter with an encrypted value

**Base Sepolia:**
- `pnpm base-sepolia:deploy-counter` - Deploy the Counter contract
- `pnpm base-sepolia:increment-counter` - Increment the counter
- `pnpm base-sepolia:reset-counter` - Reset the counter with an encrypted value

## Project Structure

- `contracts/` - Smart contract source files
  - `Counter.sol` - Example FHE counter contract with increment, decrement, reset, and on-chain decryption
- `test/` - Test files
- `tasks/` - Hardhat task files
  - `deploy-counter.ts` - Deploy the Counter contract
  - `increment-counter.ts` - Increment and read the counter
  - `reset-counter.ts` - Reset the counter with an encrypted input
  - `utils.ts` - Shared utilities (deployment tracking, CoFHE client creation)

## `@cofhe/sdk` and `@cofhe/hardhat-plugin`

This project uses `@cofhe/sdk` and the `@cofhe/hardhat-plugin` to interact with FHE (Fully Homomorphic Encryption) smart contracts. Here are the key features and utilities:

### `@cofhe/sdk` Features

- **Encryption**: Encrypt values before sending them to FHE contracts

  ```typescript
  import { Encryptable, FheTypes } from '@cofhe/sdk'

  // Encrypt an input value
  const encrypted = await client
    .encryptInputs([Encryptable.uint32(2000n)])
    .execute()
  ```

- **Decryption (off-chain view)**: Decrypt ciphertext handles for reading values off-chain

  ```typescript
  // Decrypt a ciphertext handle (off-chain, read-only)
  const decrypted = await client
    .decryptForView(ciphertextHandle, FheTypes.Uint32)
    .execute()
  ```

- **Decryption (on-chain publish)**: 3-step flow to decrypt and publish results on-chain

  ```typescript
  // Step 1: Grant public decryption permission (on-chain)
  await contract.allowCounterPublicly() // calls FHE.allowPublic(ctHash)

  // Step 2: Decrypt off-chain via the SDK (returns plaintext + Threshold Network signature)
  const result = await client
    .decryptForTx(ctHash)
    .withoutPermit()
    .execute()

  // Step 3: Submit the verified plaintext + signature back on-chain
  await contract.revealCounter(result.decryptedValue, result.signature)
  // calls FHE.publishDecryptResult(ctHash, plaintext, signature)
  ```

- **Permits**: Create and validate permits for secure contract interactions
  ```typescript
  import { PermitUtils } from '@cofhe/sdk/permits'

  // Create a self-permit
  const permit = await client.permits.createSelf({
    issuer: signer.address,
    name: 'My Permit',
  })

  // Validate a permit on-chain
  const isValid = await PermitUtils.checkValidityOnChain(
    permit,
    client.getSnapshot().publicClient!,
  )
  ```

### `@cofhe/hardhat-plugin` Features

- **Network Configuration**: Automatically configures CoFHE-enabled networks (`localcofhe`, `eth-sepolia`, `arb-sepolia`)
- **CoFHE SDK Integration**: Provides `hre.cofhe` with helpers for creating SDK clients

  ```typescript
  // Create a batteries-included client (handles mock setup automatically)
  const client = await hre.cofhe.createClientWithBatteries(signer)
  ```

- **Signer Adapter**: Convert Hardhat signers into CoFHE-compatible clients

  ```typescript
  const { publicClient, walletClient } = await hre.cofhe.hardhatSignerAdapter(signer)
  ```

- **Mock Testing Utilities**: Helper functions for testing FHE contracts in mock mode

  ```typescript
  // Log all FHE operations within a block
  await hre.cofhe.mocks.withLogs('counter.increment()', async () => {
    await counter.connect(bob).increment()
  })

  // Assert on the plaintext behind a ciphertext hash
  await hre.cofhe.mocks.expectPlaintext(countHash, 2n)

  // Get the plaintext value directly
  const plaintext = await hre.cofhe.mocks.getPlaintext(await counter.count())
  ```

### Environment Configuration

The plugin supports different environments:

- `MOCK`: For testing with mocked FHE operations on the Hardhat network
- `LOCAL`: For testing with a local CoFHE network
- `TESTNET`: For deploying and interacting on `eth-sepolia`, `arb-sepolia`, and `base-sepolia`

You can check the current environment using the chain configuration:

```typescript
import { getChainById } from '@cofhe/sdk/chains'

const chainId = Number((await signer.provider.getNetwork()).chainId)
const chain = getChainById(chainId)

if (chain.environment === 'MOCK') {
  // Use batteries-included client for mock mode
}
```

## Links and Additional Resources

### `@cofhe/sdk`

`@cofhe/sdk` is the JavaScript/TypeScript SDK for interacting with FHE smart contracts. It provides a client-based API for encryption, decryption, and permit management.

#### Key Features

- Encryption of data before sending to FHE contracts
- Decryption of ciphertext handles from contracts
- Managing permits for secure contract interactions
- Chain configuration and environment detection
- Integration with Web3 libraries (ethers.js and viem)

### `@cofhe/mock-contracts`

`@cofhe/mock-contracts` provides mock implementations of CoFHE contracts for testing FHE functionality without the actual coprocessor.

#### Features

- Mock implementations of core CoFHE contracts:
  - MockTaskManager
  - MockACL (Access Control List)
  - MockThresholdNetwork
  - MockZkVerifier
  - TestBed
- Synchronous operation simulation with mock delays
- On-chain access to unencrypted values for testing

#### Integration with Hardhat and `@cofhe/sdk`

Both `@cofhe/sdk` and `@cofhe/hardhat-plugin` interact directly with the mock contracts:

- When imported in `hardhat.config.ts`, `@cofhe/hardhat-plugin` injects necessary mock contracts into the Hardhat testnet
- `@cofhe/sdk` automatically detects mock contracts and adjusts behavior for test environments

#### Mock Behavior Differences

- **Symbolic Execution**: In mocks, ciphertext hashes point to plaintext values stored on-chain
- **On-chain Decryption**: Mock decryption uses `FHE.publishDecryptResult()` with mock Threshold Network signatures
- **ZK Verification**: Mock verifier handles on-chain storage of encrypted inputs
- **Off-chain Decryption**: When using `client.decryptForView()`, mocks return plaintext values directly from on-chain storage

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
