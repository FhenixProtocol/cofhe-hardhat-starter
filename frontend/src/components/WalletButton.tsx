"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatEther } from "viem";
import type { Connector } from "wagmi";

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="12" r="2" fill="currentColor" />
    <path d="M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DisconnectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M13 11l3-3-3-3M9 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [showMenu, setShowMenu] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatBalance = (bal: typeof balance) => {
    if (!bal) return "0";
    return `${parseFloat(formatEther(bal.value)).toFixed(4)} ${bal.symbol}`;
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#00ca48]/10 hover:bg-[#00ca48]/20 transition-all duration-200"
        >
          <div className="w-2 h-2 rounded-full bg-[#00ca48] animate-pulse" />
          <span className="text-sm font-medium text-[#00ca48]">{formatBalance(balance)}</span>
          <span className="text-sm font-medium text-[#343433]">{formatAddress(address)}</span>
          <svg className={`w-4 h-4 text-[#848281] transition-transform ${showMenu ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[#f2f0ed] overflow-hidden z-50">
            <div className="p-4 border-b border-[#f2f0ed]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2f0ed] flex items-center justify-center">
                  <span className="text-lg">👛</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#343433]">{formatAddress(address)}</p>
                  <p className="text-xs text-[#848281]">{formatBalance(balance)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <a 
                href={`https://arbiscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f7f4] text-sm text-[#474645]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                View on Arbiscan
              </a>
              
              <button
                onClick={() => { navigator.clipboard.writeText(address); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f7f4] text-sm text-[#474645]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12V2a2 2 0 012-2h10" stroke="currentColor" strokeWidth="2" />
                </svg>
                Copy Address
              </button>
              
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ff2b3a]/10 text-[#ff2b3a]"
              >
                <DisconnectIcon />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="inline-flex items-center justify-center bg-[#121212] text-white font-['Inter',system-ui,sans-serif] font-medium text-sm px-6 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433] disabled:opacity-50"
      >
        <WalletIcon />
        <span className="ml-2">{isPending ? "Connecting..." : "Connect Wallet"}</span>
      </button>

      {showConnectors && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[#f2f0ed] overflow-hidden z-50">
          <div className="p-4 border-b border-[#f2f0ed]">
            <h3 className="text-sm font-semibold text-[#343433]">Connect Wallet</h3>
            <p className="text-xs text-[#848281] mt-1">Choose your wallet provider</p>
          </div>
          
          <div className="p-2">
            {connectors.map((connector: Connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect({ connector });
                  setShowConnectors(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f8f7f4] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#f2f0ed] flex items-center justify-center">
                  {connector.id === "injected" && <span>🦊</span>}
                  {connector.id.includes("walletconnect") && <span>🔗</span>}
                  {connector.id === "coinbaseWallet" && <span>🔵</span>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#343433]">
                    {connector.name}
                  </p>
                  <p className="text-xs text-[#848281]">
                    {connector.id === "injected" ? "Browser wallet" : "Scan with QR"}
                  </p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-[#f2f0ed] bg-[#f8f7f4]">
            <div className="flex items-center gap-2 text-xs text-[#848281]">
              <CheckIcon />
              <span>Privacy-first: we never access your keys</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chain indicator component
export function ChainIndicator() {
  const { chain } = useAccount();

  if (!chain) return null;

  const chainColors: Record<number, string> = {
    42161: "#12AAFF", // Arbitrum
    421614: "#FF3E00", // Arbitrum Sepolia
    1: "#627EEA", // Ethereum
  };

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${chainColors[chain.id]}20`, color: chainColors[chain.id] }}
    >
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: chainColors[chain.id] }}
      />
      {chain.name}
    </div>
  );
}