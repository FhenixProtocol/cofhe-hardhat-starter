"use client";

import { useState } from "react";
import { LockIcon, UnlockIcon, RefreshIcon, EyeIcon, EyeOffIcon } from "./icons";

interface EncryptedBalanceProps {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  tokenSymbol?: string;
  decimals?: number;
}

export function EncryptedBalance({
  balance,
  isLoading,
  error,
  onRefresh,
  tokenSymbol = "USDC",
  decimals = 6,
}: EncryptedBalanceProps) {
  const [isVisible, setIsVisible] = useState(false);

  const formatBalance = (value: string | null): string => {
    if (value === null) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="bg-white rounded-[10px] p-6 shadow-[inset_0_0_0_1px_#f2f0ed]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LockIcon className="w-5 h-5 text-[#ff3e00]" />
          <span className="text-[15px] font-medium text-[#343433]">Private Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2 rounded-lg hover:bg-[#f2f0ed] transition-colors"
            title={isVisible ? "Hide balance" : "Show balance"}
          >
            {isVisible ? (
              <EyeOffIcon className="w-4 h-4 text-[#848281]" />
            ) : (
              <EyeIcon className="w-4 h-4 text-[#848281]" />
            )}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshIcon className={`w-4 h-4 text-[#848281] ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-4">
          <p className="text-sm text-[#ff2b3a] mb-2">Failed to decrypt balance</p>
          <button
            onClick={onRefresh}
            className="text-xs text-[#ff3e00] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-[#f2f0ed] border-t-[#ff3e00] rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#848281]">Decrypting balance...</p>
        </div>
      ) : isVisible ? (
        <div>
          <p className="text-3xl font-bold text-[#343433] mb-1">
            {formatBalance(balance)}
          </p>
          <p className="text-sm text-[#848281]">
            Encrypted on-chain • Only visible to you
          </p>
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold text-[#343433] mb-1">
            •••••••
          </p>
          <p className="text-sm text-[#848281] flex items-center gap-1">
            <LockIcon className="w-3 h-3" />
            Hidden for privacy
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#f2f0ed]">
        <div className="flex items-center gap-2 text-xs text-[#848281]">
          <div className="w-2 h-2 rounded-full bg-[#00ca48] animate-pulse" />
          <span>Privacy protected by FHE encryption</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for showing encrypted share balance
 */
interface EncryptedSharesProps {
  shares: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function EncryptedShares({ shares, isLoading, onRefresh }: EncryptedSharesProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="bg-white rounded-[10px] p-4 shadow-[inset_0_0_0_1px_#f2f0ed]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#848281] mb-1">Your Shares</p>
          <p className="text-lg font-semibold text-[#343433]">
            {isLoading ? (
              <span className="text-[#848281]">Decrypting...</span>
            ) : isVisible && shares ? (
              parseFloat(shares).toFixed(4)
            ) : (
              "••••••"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2 rounded-lg hover:bg-[#f2f0ed] transition-colors"
          >
            {isVisible ? (
              <EyeOffIcon className="w-4 h-4 text-[#848281]" />
            ) : (
              <EyeIcon className="w-4 h-4 text-[#848281]" />
            )}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 text-[#848281] ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}