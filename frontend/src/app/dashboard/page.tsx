"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "../../components/WalletButton";

// Mock vault data
const MOCK_VAULTS = [
  {
    id: "1",
    name: "USDC Growth Vault",
    address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    token: "USDC",
    apy: 8.5,
    tvl: 2450000,
    strategies: ["Aave V3 Lending", "Compound Supply"],
    risk: "low" as const,
    performance: 12.3,
  },
  {
    id: "2",
    name: "ETH Max Yield",
    address: "0x2345678901234567890123456789012345678901" as `0x${string}`,
    token: "WETH",
    apy: 15.2,
    tvl: 890000,
    strategies: ["Aave ETH Staking", "Uniswap V3 LP"],
    risk: "medium" as const,
    performance: 18.7,
  },
];

// Navigation
function Navigation() {
  return (
    <nav className="h-16 flex items-center border-b border-[#f2f0ed] bg-[#fbfaf9]">
      <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="4" fill="white" />
            </svg>
          </div>
          <span className="font-['Fraunces',Georgia,serif] text-xl font-medium text-[#343433]">CoFHE</span>
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}

// Vault Card
function VaultCard({ vault, onSelect }: { vault: typeof MOCK_VAULTS[0]; onSelect: () => void }) {
  const riskColors = {
    low: "text-[#00ca48] bg-[#00ca48]/10",
    medium: "text-[#ffbb26] bg-[#ffbb26]/10",
    high: "text-[#ff2b3a] bg-[#ff2b3a]/10",
  };

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-[10px] p-6 shadow-[inset_0_0_0_1px_#f2f0ed] cursor-pointer hover:shadow-[inset_0_0_0_1px_#f2f0ed,0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[19px] font-semibold text-[#343433]">{vault.name}</h3>
          <p className="text-sm text-[#848281]">{vault.token}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskColors[vault.risk]}`}>
          {vault.risk.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-[#848281] mb-1">APY</p>
          <p className="text-lg font-semibold text-[#00ca48]">{vault.apy}%</p>
        </div>
        <div>
          <p className="text-xs text-[#848281] mb-1">TVL</p>
          <p className="text-lg font-semibold text-[#343433]">${(vault.tvl / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-xs text-[#848281] mb-1">30D</p>
          <p className="text-lg font-semibold text-[#00ca48]">+{vault.performance}%</p>
        </div>
      </div>

      <div className="pt-4 border-t border-[#f2f0ed]">
        <p className="text-xs text-[#848281] mb-2">Strategies</p>
        <div className="flex flex-wrap gap-2">
          {vault.strategies.map((strategy, idx) => (
            <span key={idx} className="px-2 py-1 rounded-md bg-[#f2f0ed] text-xs text-[#474645]">
              {strategy}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Strategy Panel
function StrategyPanel({ vault }: { vault: typeof MOCK_VAULTS[0] | null }) {
  if (!vault) {
    return (
      <div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed] h-full flex items-center justify-center">
        <p className="text-[#848281]">Select a vault to see strategies</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] p-6 shadow-[inset_0_0_0_1px_#f2f0ed]">
      <h3 className="text-[19px] font-semibold text-[#343433] mb-6">Strategic Allocation</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#f8f7f4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00ca48] flex items-center justify-center text-white font-medium">1</div>
            <div>
              <p className="text-sm font-medium text-[#343433]">Aave V3 Lending</p>
              <p className="text-xs text-[#848281]">60% allocation</p>
            </div>
          </div>
          <span className="font-semibold text-[#00ca48]">+5.2%</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-[#f8f7f4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0090ff] flex items-center justify-center text-white font-medium">2</div>
            <div>
              <p className="text-sm font-medium text-[#343433]">Compound Supply</p>
              <p className="text-xs text-[#848281]">30% allocation</p>
            </div>
          </div>
          <span className="font-semibold text-[#0090ff]">+3.8%</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-[#f8f7f4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ffbb26] flex items-center justify-center text-[#343433] font-medium">3</div>
            <div>
              <p className="text-sm font-medium text-[#343433]">Yield Router</p>
              <p className="text-xs text-[#848281]">10% buffer</p>
            </div>
          </div>
          <span className="font-semibold text-[#ffbb26]">+0.5%</span>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[#00ca48]/10 border border-[#00ca48]/20">
        <p className="text-sm text-[#343433] font-medium mb-1">Total APY</p>
        <p className="text-2xl font-bold text-[#00ca48]">+{vault.apy}%</p>
      </div>

      <button className="w-full mt-4 bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] hover:bg-[#343433] transition-colors">
        Deploy {vault.name}
      </button>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f8f7f4] flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="8" y="14" width="24" height="16" rx="3" stroke="#ff3e00" strokeWidth="2" />
            <circle cx="26" cy="22" r="2" fill="#ff3e00" />
          </svg>
        </div>
        <h1 className="text-[44px] font-['Fraunces',Georgia,serif] text-[#343433] mb-4">Connect Your Wallet</h1>
        <p className="text-[15px] text-[#474645] mb-8">Connect to view and manage your private vaults</p>
        <WalletButton />
      </div>
    </div>
  );
}

// Dashboard Content
function DashboardContent() {
  const [selectedVault, setSelectedVault] = useState<typeof MOCK_VAULTS[0] | null>(null);

  return (
    <div className="py-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[44px] font-['Fraunces',Georgia,serif] text-[#343433] mb-2">Your Vaults</h1>
            <p className="text-[#848281]">Manage your confidential DeFi positions</p>
          </div>
          <button className="bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] hover:bg-[#343433] transition-colors">
            + Create Vault
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Available Vaults</h2>
            {MOCK_VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onSelect={() => setSelectedVault(vault)}
              />
            ))}
          </div>
          <div>
            <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Strategy</h2>
            <StrategyPanel vault={selectedVault} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function DashboardPage() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-[#fbfaf9]">
      <Navigation />
      {isConnected ? <DashboardContent /> : <EmptyState />}
    </main>
  );
}