const fs = require('fs');
const path = require('path');

const CONTRACTS = [
  'PrivateComposableVault',
  'EncryptedStrategyRegistry',
  'PrivateRebalancer',
  'YieldRouter',
  'MockStrategy',
  'MockAavePool',
  'FixedAllocationMechanism',
  'VaultFactory',
  'MockERC20',
  'Counter',
];

const ARTIFACTS_DIRS = ['./artifacts/contracts', './artifacts/contracts/test'];
const OUTPUT_DIR = './sdk/contracts/abis';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const exported = [];

for (const contractName of CONTRACTS) {
  let artifactPath = null;
  
  // Search in all artifact directories
  for (const dir of ARTIFACTS_DIRS) {
    const testPath = path.join(dir, `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(testPath)) {
      artifactPath = testPath;
      break;
    }
  }
  
  if (!artifactPath) {
    console.log(`⚠️  Artifact not found: ${contractName}`);
    continue;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  const deployedBytecode = artifact.bytecode;

  // Export ABI
  const abiPath = path.join(OUTPUT_DIR, `${contractName}.json`);
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  
  // Export bytecode
  const bytecodePath = path.join(OUTPUT_DIR, `${contractName}.bytecode.json`);
  fs.writeFileSync(bytecodePath, JSON.stringify({ bytecode: deployedBytecode }, null, 2));

  // Create TypeScript types for ABI
  const typesContent = generateTypeDefs(contractName, abi);
  const typesPath = path.join(OUTPUT_DIR, `${contractName}.types.ts`);
  fs.writeFileSync(typesPath, typesContent);

  exported.push(contractName);
  console.log(`✅ Exported ${contractName}`);
}

// Create index.ts
const indexContent = exported.map(name => 
  `export { default as ${name}Abi } from './${name}.json';`
).join('\n');
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);

// Create combined exports
const combinedExports = `// Combined ABI exports for all contracts
${exported.map(name => `import { default as ${name}Abi } from './${name}.json';`).join('\n')}

export {
${exported.map(name => `  ${name}Abi,`).join('\n')}
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
`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'combined.ts'), combinedExports);

// Create README
const readme = `# Contract ABIs

Auto-generated ABIs for the CoFHE Private Composable Vault protocol.

## Contracts
${exported.map(c => `- **${c}**`).join('\n')}

## Usage with viem

\`\`\`typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import { PrivateComposableVaultAbi } from './abis';

// Public client for read operations
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// Read contract state
const owner = await publicClient.readContract({
  address: '0x...',
  abi: PrivateComposableVaultAbi,
  functionName: 'owner',
});
\`\`\`

## Usage with CoFHE SDK (Encrypted Operations)

\`\`\`typescript
import { createClientWithBatteries } from '@cofhe/sdk';
import { Encryptable } from '@cofhe/sdk';

// Create CoFHE client
const cofheClient = await createClientWithBatteries(signer);

// Encrypt inputs for confidential operations
const encryptedAmount = await cofheClient.encryptInputs([
  Encryptable.uint256(1000000n)
]).execute();

// Write with encrypted params
await walletClient.writeContract({
  address: '0x...',
  abi: PrivateComposableVaultAbi,
  functionName: 'deposit',
  args: [encryptedAmount[0]],
});
\`\`\`

## External Contract ABIs

Aave V3 Pool: \`0x794a61358D6845594F94dc1DB02A252b5b4814aD\`
Uniswap V3 Factory: \`0x1F98431c8aD98523631AE4a59f267346ea31F984\`
Uniswap V3 Router: \`0xE592427A0AEce92De3Edee1F18E0157C05861564\`
WETH: \`0x82aF49447D8a07e3bd95BD0d56f35241523fBab1\`
`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme);

console.log(`\n📦 ABI export complete!`);
console.log(`📁 Output: ${OUTPUT_DIR}`);
console.log(`📋 Exported ${exported.length} contracts`);

function generateTypeDefs(contractName, abi) {
  const functions = abi.filter(item => item.type === 'function');
  
  const lines = [
    `// Auto-generated types for ${contractName}`,
    `// This file provides TypeScript type definitions for contract interactions`,
    ``,
    `import { InferouseType } from 'viem';`,
    ``,
    `// Function input types`,
  ];

  // Generate input types for each function
  functions.forEach(fn => {
    if (fn.inputs.length > 0) {
      const inputType = fn.inputs.map((i, idx) => {
        const name = i.name || `param${idx}`;
        return `  ${name}: ${mapType(i.type, i.components)}`;
      }).join(',\n');
      
      lines.push(`export type ${capitalize(fn.name)}Params = {`);
      lines.push(inputType);
      lines.push(`};`);
      lines.push(``);
    }

    if (fn.outputs.length > 0) {
      const outputType = fn.outputs.map((o, idx) => {
        const name = o.name || `result${idx}`;
        return `  ${name}: ${mapType(o.type, o.components)}`;
      }).join(',\n');
      
      lines.push(`export type ${capitalize(fn.name)}Result = {`);
      lines.push(outputType);
      lines.push(`};`);
      lines.push(``);
    }
  });

  // Generate enum-like for function names
  lines.push(`// Contract function names`);
  lines.push(`export const ${contractName}Functions = {`);
  functions.forEach(fn => {
    lines.push(`  ${fn.name}: '${fn.name}',`);
  });
  lines.push(`} as const;`);
  lines.push(``);

  // Generate function metadata
  lines.push(`// Function metadata`);
  lines.push(`export interface ${contractName}Metadata {`);
  functions.forEach(fn => {
    const isWrite = fn.stateMutability !== 'view' && fn.stateMutability !== 'pure';
    const hasEncrypted = fn.inputs.some(i => 
      i.components && i.components.length === 4 && 
      i.components[0]?.name === 'ctHash'
    );
    
    lines.push(`  '${fn.name}': {`);
    lines.push(`    type: '${fn.stateMutability}',`);
    if (isWrite) lines.push(`    isWrite: true,`);
    if (hasEncrypted) lines.push(`    hasEncryptedInputs: true,`);
    lines.push(`    inputs: ${fn.inputs.length},`);
    lines.push(`    outputs: ${fn.outputs.length},`);
    lines.push(`  },`);
  });
  lines.push(`};`);

  return lines.join('\n');
}

function mapType(type, components) {
  switch (type) {
    case 'address': return 'string';
    case 'uint256': return 'bigint';
    case 'uint32': return 'bigint';
    case 'uint16': return 'bigint';
    case 'uint8': return 'bigint';
    case 'int256': return 'bigint';
    case 'bool': return 'boolean';
    case 'string': return 'string';
    case 'bytes': return 'string';
    case 'bytes32': return 'string';
    case 'tuple':
      if (components) {
        const inner = components.map(c => `${c.name}: ${mapType(c.type)}`).join('; ');
        return `{ ${inner} }`;
      }
      return 'Record<string, unknown>';
    default: return type;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}