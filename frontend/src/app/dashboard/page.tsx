"use client";

import { useState } from "react";

// SVG Illustration Components
const CharacterBlob = ({
  color,
  size = 80,
  eyes = "default",
}: {
  color: string;
  size?: number;
  eyes?: "default" | "happy" | "surprised";
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <ellipse cx="50" cy="55" rx="45" ry="40" fill={color} />
    <line x1="35" y1="90" x2="30" y2="100" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <line x1="65" y1="90" x2="70" y2="100" stroke={color} strokeWidth="4" strokeLinecap="round" />
    {eyes === "default" && (
      <>
        <circle cx="35" cy="50" r="6" fill="white" />
        <circle cx="65" cy="50" r="6" fill="white" />
        <circle cx="37" cy="49" r="3" fill="#333" />
        <circle cx="67" cy="49" r="3" fill="#333" />
      </>
    )}
    {eyes === "happy" && (
      <>
        <path d="M30 48 Q35 44 40 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M60 48 Q65 44 70 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    )}
    {eyes === "surprised" && (
      <>
        <circle cx="35" cy="48" r="8" fill="white" />
        <circle cx="65" cy="48" r="8" fill="white" />
        <circle cx="35" cy="48" r="4" fill="#333" />
        <circle cx="65" cy="48" r="4" fill="#333" />
      </>
    )}
    <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const WalletIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="12" r="2" fill="currentColor" />
    <path d="M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L16 5v5c0 5-6 7-6 7s-6-2-6-7V5l6-3z" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 16l4-4 3 3 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Mock data for vaults
const MOCK_VAULTS = [
  {
    id: "1",
    name: "USDC Growth Vault",
    token: "USDC",
    tokenIcon: "💵",
    apy: 8.5,
    tvl: 2450000,
    strategies: ["Aave V3 Lending", "Compound Supply"],
    risk: "low" as const,
    performance: 12.3,
  },
  {
    id: "2",
    name: "ETH Max Yield",
    token: "WETH",
    tokenIcon: "Ξ",
    apy: 15.2,
    tvl: 890000,
    strategies: ["Aave ETH Staking", "Uniswap V3 LP"],
    risk: "medium" as const,
    performance: 18.7,
  },
  {
    id: "3",
    name: "Multi-Asset Stable",
    token: "DAI",
    tokenIcon: "◻️",
    apy: 6.8,
    tvl: 1200000,
    strategies: ["Aave DAI Lending", "Curve LP"],
    risk: "low" as const,
    performance: 7.2,
  },
  {
    id: "4",
    name: "Aggressive BTC",
    token: "WBTC",
    tokenIcon: "₿",
    apy: 22.1,
    tvl: 450000,
    strategies: ["Aave WBTC", "MakerDAO", "Compound"],
    risk: "high" as const,
    performance: 25.4,
  },
];

// Types
interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
}

// Navigation Component
function Navigation({ onConnect, walletState }: { onConnect: () => void; walletState: WalletState }) {
  return (
    <nav className="nav-container">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="4" fill="white" />
            </svg>
          </div>
          <span className="font-['Fraunces',Georgia,serif] text-xl font-medium text-[#343433]">CoFHE</span>
        </div>

        <div className="flex items-center gap-3">
          {walletState.connected ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-[#f2f0ed] text-sm font-medium text-[#343433]">
                {walletState.balance} ETH
              </div>
              <div className="px-4 py-2 rounded-full bg-[#00ca48]/10 text-sm font-medium text-[#00ca48]">
                {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
              </div>
            </div>
          ) : (
            <button onClick={onConnect} className="inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
              <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="12" r="2" fill="currentColor" />
                <path d="M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// Vault Card Component
function VaultCard({ vault, isSelected, onSelect }: { vault: typeof MOCK_VAULTS[0]; isSelected: boolean; onSelect: () => void }) {
  const riskColors = {
    low: "text-[#00ca48] bg-[#00ca48]/10",
    medium: "text-[#ffbb26] bg-[#ffbb26]/10",
    high: "text-[#ff2b3a] bg-[#ff2b3a]/10",
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed] cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-[#ff3e00] shadow-lg" : ""
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
          {vault.risk.toUpperCase()} RISK
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-[#848281] mb-1">APY</p>
          <p className="text-lg font-semibold text-[#00ca48]">{vault.apy}%</p>
        </div>
        <div>
          <p className="text-xs text-[#848281] mb-1">TVL</p>
          <p className="text-lg font-semibold text-[#343433]">
            ${(vault.tvl / 1000000).toFixed(1)}M
          </p>
        </div>
        <div>
          <p className="text-xs text-[#848281] mb-1">30D Return</p>
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

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-[#f2f0ed]">
          <div className="flex items-center gap-2 text-[#00ca48] text-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L16 5v5c0 5-6 7-6 7s-6-2-6-7V5l6-3z" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Privacy Verified
          </div>
        </div>
      )}
    </div>
  );
}

// Strategy Recommendation Component
function StrategyRecommendation({ selectedVault }: { selectedVault: typeof MOCK_VAULTS[0] | null }) {
  if (!selectedVault) return null;

  const strategies = [
    { name: "Aave V3 Lending", allocation: "60%", apy: "+5.2%", color: "#00ca48", icon: "1" },
    { name: selectedVault.token === "USDC" ? "Compound Supply" : "Uniswap V3 LP", allocation: "30%", apy: "+3.8%", color: "#0090ff", icon: "2" },
    { name: "Yield Router", allocation: "10%", apy: "+0.5%", color: "#ffbb26", icon: "3" },
  ];

  return (
    <div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#ff3e00]/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 16l4-4 3 3 7-8" stroke="#ff3e00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-[19px] font-semibold text-[#343433]">Strategic Allocation</h3>
          <p className="text-sm text-[#848281]">AI-powered recommendation</p>
        </div>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-[#f8f7f4]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: strategy.color }}>
                {strategy.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[#343433]">{strategy.name}</p>
                <p className="text-xs text-[#848281]">{strategy.allocation} allocation</p>
              </div>
            </div>
            <span className="font-semibold" style={{ color: strategy.color }}>{strategy.apy} APY</span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[#00ca48]/10 border border-[#00ca48]/20">
        <p className="text-sm text-[#343433] font-medium mb-1">Total Projected APY</p>
        <p className="text-3xl font-bold text-[#00ca48]">+{selectedVault.apy}%</p>
      </div>

      <button className="w-full inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] mt-4 transition-all duration-200 hover:bg-[#343433]">
        Deploy {selectedVault.name}
        <svg className="ml-2" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// Empty State for No Wallet
function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#fbfaf9]" />
      
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Decorative characters */}
      <div className="absolute top-20 left-[10%] animate-[float_4s_ease-in-out_infinite]">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="55" rx="45" ry="40" fill="#ff3e00" />
          <line x1="35" y1="90" x2="30" y2="100" stroke="#ff3e00" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="90" x2="70" y2="100" stroke="#ff3e00" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 48 Q35 44 40 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M60 48 Q65 44 70 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="absolute bottom-40 right-[15%] animate-[float_4s_ease-in-out_infinite]" style={{ animationDelay: "0.5s" }}>
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="55" rx="45" ry="40" fill="#00ca48" />
          <line x1="35" y1="90" x2="30" y2="100" stroke="#00ca48" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="90" x2="70" y2="100" stroke="#00ca48" strokeWidth="4" strokeLinecap="round" />
          <circle cx="35" cy="50" r="6" fill="white" />
          <circle cx="65" cy="50" r="6" fill="white" />
          <circle cx="37" cy="49" r="3" fill="#333" />
          <circle cx="67" cy="49" r="3" fill="#333" />
          <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="absolute top-40 right-[20%] animate-[float_4s_ease-in-out_infinite]" style={{ animationDelay: "1s" }}>
        <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
          <ellipse cx="50" cy="55" rx="45" ry="40" fill="#0090ff" />
          <line x1="35" y1="90" x2="30" y2="100" stroke="#0090ff" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="90" x2="70" y2="100" stroke="#0090ff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="35" cy="48" r="8" fill="white" />
          <circle cx="65" cy="48" r="8" fill="white" />
          <circle cx="35" cy="48" r="4" fill="#333" />
          <circle cx="65" cy="48" r="4" fill="#333" />
          <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#f8f7f4] flex items-center justify-center">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="8" y="20" width="44" height="30" rx="6" stroke="#ff3e00" strokeWidth="3" />
            <circle cx="40" cy="35" r="5" fill="#ff3e00" />
            <path d="M16 28h12" stroke="#ff3e00" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 5 L30 15" stroke="#ffbb26" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 5 L25 10" stroke="#ffbb26" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 5 L35 10" stroke="#ffbb26" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-[44px] font-['Fraunces',Georgia,serif] font-medium text-[#343433] mb-4 leading-[1.09] tracking-[-1.14px]">
          Connect Your Wallet
        </h1>
        
        <p className="text-[15px] text-[#474645] mb-8 max-w-md mx-auto leading-[1.47] tracking-[-0.2px]">
          Connect your wallet to view your private vaults, track performance, and deploy new strategies with encrypted operations.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={onConnect} className="inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-base px-8 py-4 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
            <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="17" cy="12" r="2" fill="currentColor" />
              <path d="M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Connect Wallet
          </button>
          <button className="inline-flex items-center justify-center bg-[#f6f4ef] text-[#121212] font-['Inter',system-ui,sans-serif] font-medium text-base px-8 py-4 rounded-[32px] transition-all duration-200 hover:bg-[#f2f0ed]">
            Go to App
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[#848281]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ca48]" />
            Encrypted
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0090ff]" />
            Private
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ffbb26]" />
            Secure
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Vault Modal
function CreateVaultModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] shadow-lg max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#848281] hover:text-[#343433] transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-[23px] font-semibold text-[#343433] mb-6">Create New Vault</h2>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? "bg-[#ff3e00] text-white" : "bg-[#f2f0ed] text-[#848281]"
              }`}>
                {s}
              </div>
              {s < 3 && <div className="w-8 h-0.5 bg-[#f2f0ed]" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#343433] mb-2">Vault Name</label>
              <input
                type="text"
                placeholder="My Private Vault"
                className="w-full px-4 py-3 rounded-[10px] border border-[#f2f0ed] focus:border-[#ff3e00] focus:ring-1 focus:ring-[#ff3e00] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#343433] mb-2">Token</label>
              <select className="w-full px-4 py-3 rounded-[10px] border border-[#f2f0ed] focus:border-[#ff3e00] outline-none">
                <option>USDC</option>
                <option>WETH</option>
                <option>DAI</option>
                <option>WBTC</option>
              </select>
            </div>
            <button onClick={() => setStep(2)} className="w-full inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] mt-4 transition-all duration-200 hover:bg-[#343433]">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[#848281] mb-4">Configure encrypted vault parameters</p>
            <div>
              <label className="block text-sm font-medium text-[#343433] mb-2">Creator Fee (bps)</label>
              <input
                type="number"
                placeholder="200"
                className="w-full px-4 py-3 rounded-[10px] border border-[#f2f0ed] focus:border-[#ff3e00] outline-none"
              />
            </div>
            <div className="p-4 rounded-lg bg-[#f8f7f4]">
              <p className="text-xs text-[#848281] mb-2">All parameters are encrypted on-chain</p>
              <div className="flex items-center gap-2 text-[#00ca48] text-sm">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L16 5v5c0 5-6 7-6 7s-6-2-6-7V5l6-3z" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Privacy Verified
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 inline-flex items-center justify-center bg-[#f6f4ef] text-[#121212] font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#f2f0ed]">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#00ca48]/10 border border-[#00ca48]/20 text-center">
              <p className="text-2xl font-bold text-[#00ca48] mb-2">Ready to Deploy</p>
              <p className="text-sm text-[#474645]">
                Your private vault will be created with encrypted parameters
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 inline-flex items-center justify-center bg-[#f6f4ef] text-[#121212] font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#f2f0ed]">
                Back
              </button>
              <button onClick={onClose} className="flex-1 inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
                Deploy Vault
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Content
function DashboardContent() {
  const [selectedVault, setSelectedVault] = useState<typeof MOCK_VAULTS[0] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="py-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[44px] font-['Fraunces',Georgia,serif] font-medium text-[#343433] leading-[1.09] tracking-[-1.14px] mb-2">Your Vaults</h1>
            <p className="text-[15px] text-[#848281]">Manage your confidential DeFi positions</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
            <svg className="mr-2" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Create Vault
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Vault List */}
          <div className="space-y-4">
            <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Select a Vault</h2>
            {MOCK_VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                isSelected={selectedVault?.id === vault.id}
                onSelect={() => setSelectedVault(vault)}
              />
            ))}
          </div>

          {/* Right Column - Strategy Panel */}
          <div className="space-y-4">
            {selectedVault ? (
              <StrategyRecommendation selectedVault={selectedVault} />
            ) : (
              <div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed] h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f2f0ed] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M16 4L28 12v8c0 8-12 12-12 12S4 28 4 20v-8L16 4z" stroke="#848281" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                  <p className="text-[15px] text-[#848281]">Select a vault to see strategic recommendations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    balance: null,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<typeof MOCK_VAULTS[0] | null>(null);

  const handleConnect = async () => {
    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setWalletState({
      connected: true,
      address: "0x1234...5678",
      balance: "1.45",
    });
  };

  return (
    <main className="min-h-screen bg-[#fbfaf9]">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
      <Navigation onConnect={handleConnect} walletState={walletState} />
      
      {walletState.connected ? (
        <div className="py-8 px-6">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-[44px] font-['Fraunces',Georgia,serif] font-medium text-[#343433] leading-[1.09] tracking-[-1.14px] mb-2">Your Vaults</h1>
                <p className="text-[15px] text-[#848281]">Manage your confidential DeFi positions</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]">
                <svg className="mr-2" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Create Vault
              </button>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Vault List */}
              <div className="space-y-4">
                <h2 className="text-[19px] font-semibold text-[#343433] mb-4">Select a Vault</h2>
                {MOCK_VAULTS.map((vault) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    isSelected={selectedVault?.id === vault.id}
                    onSelect={() => setSelectedVault(vault)}
                  />
                ))}
              </div>

              {/* Right Column - Strategy Panel */}
              <div className="space-y-4">
                {selectedVault ? (
                  <StrategyRecommendation selectedVault={selectedVault} />
                ) : (
                  <div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed] h-full flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f2f0ed] flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <path d="M16 4L28 12v8c0 8-12 12-12 12S4 28 4 20v-8L16 4z" stroke="#848281" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                      <p className="text-[15px] text-[#848281]">Select a vault to see strategic recommendations</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState onConnect={handleConnect} />
      )}

      <CreateVaultModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </main>
  );
}