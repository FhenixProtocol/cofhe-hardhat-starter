"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { LockIcon, ArrowUpIcon, CheckIcon, XIcon, SpinnerIcon, KeyIcon } from "./icons";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  onWithdraw: (shares: bigint, recipient: `0x${string}`) => Promise<boolean>;
  maxShares?: bigint;
  estimatedOutput?: bigint;
}

type Step = "input" | "confirm" | "processing" | "success" | "error";

export function WithdrawModal({
  isOpen,
  onClose,
  vaultName,
  tokenSymbol,
  tokenDecimals = 6,
  onWithdraw,
  maxShares,
  estimatedOutput,
}: WithdrawModalProps) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<Step>("input");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    if (maxShares) {
      const maxFormatted = (Number(maxShares) / Math.pow(10, tokenDecimals)).toString();
      setAmount(maxFormatted);
    }
  };

  const handleWithdraw = useCallback(async () => {
    if (!amount || isNaN(parseFloat(amount)) || !address) {
      setError("Please enter a valid amount");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      // Convert to shares units (bigint)
      const sharesInUnits = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenDecimals)));
      
      const success = await onWithdraw(sharesInUnits, address);
      
      if (success) {
        setStep("success");
        setTimeout(() => {
          onClose();
          setStep("input");
          setAmount("");
        }, 2000);
      } else {
        setStep("error");
        setError("Transaction failed");
      }
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  }, [amount, tokenDecimals, onWithdraw, onClose, address]);

  const handleTryAgain = () => {
    setStep("input");
    setError(null);
  };

  if (!isOpen) return null;

  // Estimate output amount
  const outputAmount = estimatedOutput && amount
    ? (parseFloat(amount) * Number(estimatedOutput) / Math.pow(10, tokenDecimals)).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={step !== "processing" ? onClose : undefined} 
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-lg max-w-md w-full p-8">
        <button 
          onClick={step !== "processing" ? onClose : undefined}
          className="absolute top-4 right-4 text-[#848281] hover:text-[#343433] transition-colors disabled:opacity-50"
          disabled={step === "processing"}
        >
          <XIcon className="w-6 h-6" />
        </button>

        {step === "input" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#0090ff]/10 flex items-center justify-center">
                <ArrowUpIcon className="w-6 h-6 text-[#0090ff]" />
              </div>
              <div>
                <h2 className="text-[23px] font-semibold text-[#343433]">Withdraw</h2>
                <p className="text-sm text-[#848281]">{vaultName}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#343433] mb-2">
                Shares to Withdraw
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 pr-20 rounded-[10px] border border-[#f2f0ed] focus:border-[#ff3e00] focus:ring-1 focus:ring-[#ff3e00] outline-none text-lg"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-[#848281]">Shares</span>
                  {maxShares && (
                    <button
                      onClick={handleMaxClick}
                      className="px-2 py-1 text-xs font-medium text-[#ff3e00] bg-[#ff3e00]/10 rounded-md hover:bg-[#ff3e00]/20 transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              {error && (
                <p className="text-sm text-[#ff2b3a] mt-2">{error}</p>
              )}
            </div>

            {/* Estimated output */}
            {outputAmount && (
              <div className="p-4 rounded-lg bg-[#f8f7f4] mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#848281]">You will receive (est.)</span>
                  <span className="text-sm font-medium text-[#343433]">
                    ~{outputAmount} {tokenSymbol}
                  </span>
                </div>
              </div>
            )}

            {/* Privacy notice */}
            <div className="p-4 rounded-lg bg-[#ffbb26]/10 border border-[#ffbb26]/20 mb-6">
              <div className="flex items-start gap-3">
                <KeyIcon className="w-5 h-5 text-[#ffbb26] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#343433] mb-1">
                    Decrypt to Proceed
                  </p>
                  <p className="text-xs text-[#848281]">
                    Your share amount needs to be decrypted for the withdrawal. This will reveal your balance to the threshold network for verification.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!amount || parseFloat(amount) <= 0 || !isConnected}
              className="w-full inline-flex items-center justify-center bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>

            {!isConnected && (
              <p className="text-center text-sm text-[#848281] mt-4">
                Connect your wallet to withdraw
              </p>
            )}
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#ffbb26]/10 flex items-center justify-center">
                <KeyIcon className="w-6 h-6 text-[#ffbb26]" />
              </div>
              <div>
                <h2 className="text-[23px] font-semibold text-[#343433]">Confirm Withdrawal</h2>
                <p className="text-sm text-[#848281]">Review your transaction</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8f7f4] mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#848281]">Shares</span>
                <span className="text-sm font-medium text-[#343433]">
                  {parseFloat(amount).toLocaleString()}
                </span>
              </div>
              {outputAmount && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#848281]">You receive</span>
                  <span className="text-sm font-medium text-[#343433]">
                    ~{outputAmount} {tokenSymbol}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-[#848281]">Decryption</span>
                <span className="text-sm font-medium text-[#ffbb26]">Required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#848281]">To</span>
                <span className="text-sm font-medium text-[#343433]">Your Wallet</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("input")}
                className="flex-1 inline-flex items-center justify-center bg-[#f6f4ef] text-[#121212] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#f2f0ed]"
              >
                Back
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 inline-flex items-center justify-center bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]"
              >
                Withdraw
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff3e00]/10 flex items-center justify-center">
              <SpinnerIcon className="w-8 h-8 text-[#ff3e00]" />
            </div>
            <h2 className="text-[23px] font-semibold text-[#343433] mb-2">
              Decrypting & Processing...
            </h2>
            <p className="text-sm text-[#848281]">
              Verifying your encrypted balance for withdrawal
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00ca48]/10 flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-[#00ca48]" />
            </div>
            <h2 className="text-[23px] font-semibold text-[#343433] mb-2">
              Withdrawal Successful!
            </h2>
            <p className="text-sm text-[#848281]">
              Your tokens have been sent to your wallet
            </p>
          </div>
        )}

        {step === "error" && (
          <>
            <div className="text-center py-4 mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff2b3a]/10 flex items-center justify-center">
                <XIcon className="w-8 h-8 text-[#ff2b3a]" />
              </div>
              <h2 className="text-[23px] font-semibold text-[#343433] mb-2">
                Transaction Failed
              </h2>
              <p className="text-sm text-[#848281]">
                {error || "Something went wrong. Please try again."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center bg-[#f6f4ef] text-[#121212] font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#f2f0ed]"
              >
                Cancel
              </button>
              <button
                onClick={handleTryAgain}
                className="flex-1 inline-flex items-center justify-center bg-[#121212] text-white font-medium text-sm px-7 py-3 rounded-[32px] transition-all duration-200 hover:bg-[#343433]"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}