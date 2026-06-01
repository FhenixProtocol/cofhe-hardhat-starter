"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { useAccount, useWalletClient } from "wagmi";
import { createCofheConfig, createCofheClient } from "@cofhe/sdk/web";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { arbSepolia } from "@cofhe/sdk/chains";

// Types for encrypted input
type EncryptedInput = {
  ctHash: bigint;
  securityZone: number;
  utype: FheTypes;
  signature: string;
};

// Context interface
interface CoFHEContextType {
  isReady: boolean;
  isConnecting: boolean;
  encrypt: (value: bigint, type: "uint128" | "uint64") => Promise<EncryptedInput>;
  decrypt: (ctHash: bigint, type: "uint128" | "uint64") => Promise<bigint>;
  getOrCreatePermit: () => Promise<void>;
}

// Create context
const CoFHEContext = createContext<CoFHEContextType | null>(null);

// Provider component with real CoFHE SDK
export function CoFHEProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<ReturnType<typeof createCofheClient> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize CoFHE client
  useEffect(() => {
    const config = createCofheConfig({
      supportedChains: [arbSepolia],
      useWorkers: typeof window !== "undefined",
    });
    const cofheClient = createCofheClient(config);
    setClient(cofheClient);
  }, []);

  // Connect client when wallet is available
  useEffect(() => {
    if (!client || !walletClient || !address) {
      setIsReady(false);
      return;
    }

    const connectClient = async () => {
      setIsConnecting(true);
      try {
        const publicClient = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(),
        });
        // @ts-expect-error - Type mismatch between wagmi/wagmi viem types and SDK's bundled viem
        await client.connect(publicClient, walletClient);
        setIsReady(true);
      } catch (err) {
        console.error("Failed to connect CoFHE client:", err);
        setIsReady(false);
      } finally {
        setIsConnecting(false);
      }
    };

    connectClient();
  }, [client, walletClient, address]);

  // Encrypt function
  const encrypt = useCallback(
    async (value: bigint, type: "uint128" | "uint64"): Promise<EncryptedInput> => {
      if (!client || !isReady) {
        throw new Error("CoFHE client not ready");
      }

      const encryptable = type === "uint128" 
        ? Encryptable.uint128(value) 
        : Encryptable.uint64(value);

      const result = await client.encryptInputs([encryptable]).execute();
      return result[0] as EncryptedInput;
    },
    [client, isReady]
  );

  // Decrypt function
  const decrypt = useCallback(
    async (ctHash: bigint, type: "uint128" | "uint64"): Promise<bigint> => {
      if (!client || !isReady) {
        throw new Error("CoFHE client not ready");
      }

      const fheType = type === "uint128" ? FheTypes.Uint128 : FheTypes.Uint64;
      const permit = await client.permits.getOrCreateSelfPermit();
      const result = await client.decryptForView(ctHash, fheType).withPermit(permit).execute();
      return result as bigint;
    },
    [client, isReady]
  );

  // Get or create permit
  const getOrCreatePermit = useCallback(async () => {
    if (!client || !isReady) {
      throw new Error("CoFHE client not ready");
    }
    await client.permits.getOrCreateSelfPermit();
  }, [client, isReady]);

  const value: CoFHEContextType = {
    isReady: isReady && isConnected,
    isConnecting,
    encrypt,
    decrypt,
    getOrCreatePermit,
  };

  return (
    <CoFHEContext.Provider value={value}>
      {children}
    </CoFHEContext.Provider>
  );
}

// Hook to use CoFHE context
export function useCoFHE() {
  const context = useContext(CoFHEContext);
  if (!context) {
    throw new Error("useCoFHE must be used within CoFHEProvider");
  }
  return context;
}