"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains";
import { injected } from "wagmi/connectors";

// Wagmi config
const wagmiConfig = createConfig({
  chains: [arbitrum, arbitrumSepolia, mainnet],
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}