import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import { Counter } from "../typechain-types";
import { cofhejs, Encryptable, EncryptStep, Environment, FheTypes } from 'cofhejs/node'
import {
	cofhejs_initializeWithHardhatSigner
} from 'cofhe-hardhat-plugin'

// Directory to store deployed contract addresses
const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");

// Ensure the deployments directory exists
if (!fs.existsSync(DEPLOYMENTS_DIR)) {
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

// Helper to get deployment file path for a network
const getDeploymentPath = (network: string) => 
  path.join(DEPLOYMENTS_DIR, `${network}.json`);

// Helper to save deployment info
const saveDeployment = (network: string, contractName: string, address: string) => {
  const deploymentPath = getDeploymentPath(network);
  
  let deployments: Record<string, string> = {};
  if (fs.existsSync(deploymentPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as Record<string, string>;
  }
  
  deployments[contractName] = address;
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  console.log(`Deployment saved to ${deploymentPath}`);
};

// Helper to get deployment info
const getDeployment = (network: string, contractName: string): string | null => {
  const deploymentPath = getDeploymentPath(network);
  
  if (!fs.existsSync(deploymentPath)) {
    return null;
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as Record<string, string>;
  return deployments[contractName] || null;
};

// Task to deploy the Counter contract
task("deploy-counter", "Deploy the Counter contract to the selected network")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;
    
    console.log(`Deploying Counter to ${network.name}...`);
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Deploy the contract
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();
    await counter.waitForDeployment();
    
    const counterAddress = await counter.getAddress();
    console.log(`Counter deployed to: ${counterAddress}`);
    
    // Save the deployment
    saveDeployment(network.name, "Counter", counterAddress);
    
    return counterAddress;
  });

// Task to increment the counter
task("increment-counter", "Increment the counter on the deployed contract")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;
    
    // Get the Counter contract address
    const counterAddress = getDeployment(network.name, "Counter");
    if (!counterAddress) {
      console.error(`No Counter deployment found for network ${network.name}`);
      console.error(`Please deploy first using: npx hardhat deploy-counter --network ${network.name}`);
      return;
    }
    
    console.log(`Using Counter at ${counterAddress} on ${network.name}`);
    
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log(`Using account: ${signer.address}`);
    await cofhejs_initializeWithHardhatSigner(signer);

    // Get the contract instance with proper typing
    const Counter = await ethers.getContractFactory("Counter");
    const counter = Counter.attach(counterAddress) as unknown as Counter;
    
    // Get current count
    const currentCount = await counter.count();
    console.log(`Current count: ${currentCount}`);
    
    // Increment the counter
    console.log("Incrementing counter...");
    const tx = await counter.increment();
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    
    // Get new count
    const newCount = await counter.count();
    console.log(`New count: ${newCount}`);
    console.log("Unsealing new count...");
    const unsealedCount = await cofhejs.unseal(newCount, FheTypes.Uint32);
    console.log(unsealedCount);
  }); 