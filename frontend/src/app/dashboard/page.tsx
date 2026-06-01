"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "../../components/WalletButton";
import { EncryptedBalance } from "../../components/EncryptedBalance";
import { DepositModal } from "../../components/DepositModal";
import { WithdrawModal } from "../../components/WithdrawModal";
import { LockIcon, ArrowDownIcon, ArrowUpIcon, ShieldIcon } from "../../components/icons";

// Mock vault data
const MOCK_VAULTS = [
  {
    id: "1",
    name: "USDC Growth Vault",
    address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    token: "USDC",
    tokenIcon: "💵",
    apy: 8.5,
    tvl: 2450000,
    strategies: ["Aave V3 Lending", "Compound Supply"],
    risk: "low" as const,
    performance: 12.3,
    decimals: 6,
  },
  {
    id: "2",
    name: "ETH Max Yield",
    address: "0x2345678901234567890123456789012345678901" as `0x${string}`,
    token: "WETH",
    tokenIcon: "Ξ",
    apy: 15.2,
    tvl: 890000,
    strategies: ["Aave ETH Staking", "Uniswap V3 LP"],
    risk: "medium" as const,
    performance: 18.7,
    decimals: 18,
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

// Vault Card with privacy features
function VaultCard({ vault, onSelect, isSelected }: { 
  vault: typeof MOCK_VAULTS[0]; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const riskColors = {
    low: "text-[#00ca48] bg-[#00ca48]/10",
    medium: "text-[#ffbb26] bg-[#ffbb26]/10",
    high: "text-[#ff2b3a] bg-[#ff2b3a]/10",
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-[10px] p-6 cursor-pointer transition-all duration-200 hover:shadow-[inset_0_0_0_1px_#f2f0ed,0_4px_12px_rgba(0,0,0,0.05)] ${
        isSelected ? "ring-2 ring-[#ff3e00]" : "shadow-[inset_0_0_0_1px_#f2f0ed]"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#f2f0ed] flex items-center justify-center text-2xl">
            {vault.tokenIcon}
          </div>
          <div>
            <h3 className="text-[19px] font-semibold text-[#343433]">{vault.name}</h3>
            <p className="text-sm text-[#848281]">{vault.token}</p>
          </div>
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

      {isSelected && (
        <div className="pt-4 border-t border-[#f2f0ed]">
          <div className="flex items-center gap-2 text-[#00ca48] text-sm">
            <ShieldIcon className="w-4 h-4" />
            Privacy Verified • FHE Protected
          </div>
        </div>
      )}
    </div>
  );
}

// Strategy Panel
function StrategyPanel({ vault, onDeposit, onWithdraw }: { 
  vault: typeof MOCK_VAULTS[0] | null;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  if (!vault) {
    return (
      <div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed] h-full flex items-center justify-center">
        <p className="text-[#848281]">Select a vault to manage</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encrypted Balance Display */}
      <EncryptedBalance
        balance={null}
        isLoading={false}
        error={null}
        onRefresh={() => console.log("Refresh balance")}
        tokenSymbol={vault.token}
        decimals={vault.decimals}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onDeposit}
          className="flex items-center justify-center gap-2 bg-[#00ca48] text-white font-medium text-sm px-6 py-3 rounded-[32px] hover:bg-[#00b342] transition-colors"
        >
          <ArrowDownIcon className="w-4 h-4" />
          Deposit
        </button>
        <button
          onClick={onWithdraw}
          className="flex items-center justify-center gap-2 bg-[#0090ff] text-white font-medium text-sm px-6 py-3 rounded-[32px] hover:bg-[#0077cc] transition-colors"
        >
          <ArrowUpIcon className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Strategy Allocation */}
      <div className="bg-white rounded-[10px] p-6 shadow-[inset_0_0_0_1px_#f2f0ed]">
        <h3 className="text-[19px] font-semibold text-[#343433] mb-4">Strategy Allocation</h3>
        <div className="space-y-3">
          {vault.strategies.map((strategy, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#f8f7f4]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ff3e00]/10 flex items-center justify-center text-xs font-medium text-[#ff3e00]">
                  {idx + 1}
                </div>
                <span className="text-sm text-[#343433]">{strategy}</span>
              </div>
              <div className="flex items-center gap-2">
                <LockIcon className="w-3 h-3 text-[#00ca48]" />
                <span className="text-xs text-[#848281]">Encrypted</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Info */}
      <div className="p-4 rounded-lg bg-[#00ca48]/10 border border-[#00ca48]/20">
        <div className="flex items-start gap-3">
          <LockIcon className="w-5 h-5 text-[#00ca48] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#343433] mb-1">FHE Privacy</p>
            <p className="text-xs text-[#848281]">
              Your deposits and balances are encrypted on-chain. Only you can view your actual amounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f8f7f4] flex items-center justify-center">
          <LockIcon className="w-10 h-10 text-[#ff3e00]" />
        </div>
        <h1 className="text-[44px] font-['Fraunces',Georgia,serif] text-[#343433] mb-4">Connect Your Wallet</h1>
        <p className="text-[15px] text-[#474645] mb-8">Connect to view and manage your private vaults with FHE encryption</p>
        <WalletButton />
      </div>
    </div>
  );
}

// Dashboard Content
function DashboardContent() {
  const { isConnected } = useAccount();
  const [selectedVault, setSelectedVault] = useState<typeof MOCK_VAULTS[0] | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleDeposit = async (amount: bigint): Promise<boolean> => {
    // Simulate deposit - in real app, use useEncryptedDeposit hook
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Depositing:", amount);
    return true;
  };

  const handleWithdraw = async (shares: bigint, recipient: `0x${string}`): Promise<boolean> => {
    // Simulate withdraw - in real app, use useEncryptedWithdraw hook
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Withdrawing:", shares, "to", recipient);
    return true;
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[44px] font-['Fraunces',Georgia,serif] text-[#343433] mb-2">Your Vaults</h1>
            <p className="text-[#848281]">Confidential DeFi with FHE encryption</p>
          </div>
          <button className="bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] hover:bg-[#343433] transition-colors">
            + Create Vault
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Vault List */}
          <div className="space-y-4">
            <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Available Vaults</h2>
            {MOCK_VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                isSelected={selectedVault?.id === vault.id}
                onSelect={() => setSelectedVault(vault)}
              />
            ))}
          </div>

          {/* Right Column - Actions & Balance */}
          <div>
            <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Manage</h2>
            <StrategyPanel 
              vault={selectedVault}
              onDeposit={() => setShowDepositModal(true)}
              onWithdraw={() => setShowWithdrawModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedVault && (
        <>
          <DepositModal
            isOpen={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            vaultName={selectedVault.name}
            tokenSymbol={selectedVault.token}
            tokenDecimals={selectedVault.decimals}
            onDeposit={handleDeposit}
          />
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            vaultName={selectedVault.name}
            tokenSymbol={selectedVault.token}
            tokenDecimals={selectedVault.decimals}
            onWithdraw={handleWithdraw}
          />
        </>
      )}
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