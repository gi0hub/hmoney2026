'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { base, sepolia, mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export const config = getDefaultConfig({
    appName: 'HyperDrop',
    projectId: 'YOUR_PROJECT_ID', // TODO: Get a real Project ID from WalletConnect
    chains: [mainnet, sepolia, base, polygon, optimism, arbitrum],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
