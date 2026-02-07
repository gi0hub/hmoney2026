'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAccount, useWalletClient, useSwitchChain, usePublicClient } from 'wagmi';
import { NitroliteClient } from '@erc7824/nitrolite';
import { Address } from 'viem';

// WebSocket config types
interface ChainConfig {
    chain_id: number;
    name: string;
    type: string;
}

interface ContractConfig {
    custody: Address;
    adjudicator: Address;
    guestAddress: Address;
    tokenAddress: Address;
}

interface ConfigResponse {
    res: [
        number,
        string,
        {
            chains: ChainConfig[];
            contracts: Record<number, ContractConfig>;
        },
        number
    ];
    sig: any[];
}

export type ChannelState = 'IDLE' | 'DEPOSITING' | 'OPEN' | 'CLOSING';

export function useYellowAuction() {
    const { address, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    // Use Sepolia Public Client specifically to avoid network mismatch
    const publicClient = usePublicClient({ chainId: 11155111 });
    const { switchChain } = useSwitchChain();

    const [channelState, setChannelState] = useState<ChannelState>('IDLE');
    const [credits, setCredits] = useState<number>(0);
    const [channelId, setChannelId] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);

    // Config State
    const [sepoliaConfig, setSepoliaConfig] = useState<{
        chainId: number;
        addresses: ContractConfig;
    } | null>(null);

    // Persistence Logic (Credits)
    useEffect(() => {
        if (!address) {
            setCredits(0);
            setChannelState('IDLE');
            return;
        }

        const storageKey = `hyperdrop_credits_${address}`;

        // 1. Initial Load
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const val = parseInt(stored);
            setCredits(val);
            if (val > 0) setChannelState('OPEN');
        } else {
            setCredits(0);
        }

        // 2. Cross-tab sync
        const handleStorage = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue !== null) {
                const newVal = parseInt(e.newValue);
                setCredits(prev => {
                    if (prev !== newVal) return newVal;
                    return prev;
                });
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [address]); // Only run when address changes

    // Ensure we have a channelId if we have credits
    useEffect(() => {
        if (credits > 0 && !channelId) {
            const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setChannelId(`0x${randomHex}`);
            setChannelState('OPEN');
        }
    }, [credits, channelId]);

    useEffect(() => {
        if (address) {
            const currentStr = localStorage.getItem(`hyperdrop_credits_${address}`);
            if (currentStr !== credits.toString()) {
                localStorage.setItem(`hyperdrop_credits_${address}`, credits.toString());
            }
        }
    }, [credits, address]);

    // ClearNode config fetch
    useEffect(() => {
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

            ws.onopen = () => {
                const request = {
                    req: [1, 'get_config', {}, Date.now()],
                    sig: []
                };
                if (ws) {
                    ws.send(JSON.stringify(request));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    // console.log('config:', response);

                    if (response.res && response.res[1] === 'get_config') {
                        const payload = response.res[2];
                        const contractsMap = payload?.contracts;

                        // Check networks array if contracts map is missing
                        if (!contractsMap && payload?.networks && Array.isArray(payload.networks)) {
                            const sepoliaNet = payload.networks.find((n: any) => n.chain_id === 11155111);
                            if (sepoliaNet) {
                                const networkConfig = {
                                    custody: sepoliaNet.custody_address,
                                    adjudicator: sepoliaNet.adjudicator_address,
                                    guestAddress: sepoliaNet.custody_address,
                                    tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
                                };
                                console.log('[Yellow] Found Sepolia Nitrolite Config (from networks):', networkConfig);
                                setSepoliaConfig({
                                    chainId: 11155111,
                                    addresses: networkConfig as ContractConfig
                                });
                                return;
                            }
                        }

                        if (!contractsMap) {
                            console.warn('[Yellow] No contracts map in response. Payload:', response.res[2]);
                            return;
                        }

                        // Look for Sepolia (11155111)
                        const sepoliaId = 11155111;
                        const config = contractsMap[sepoliaId] || contractsMap[sepoliaId.toString()];

                        if (config) {
                            console.log('[Yellow] Found Sepolia Nitrolite Config:', config);
                            setSepoliaConfig({
                                chainId: sepoliaId,
                                addresses: config
                            });
                        } else {
                            console.warn('[Yellow] Sepolia config not found in ClearNode response list:', Object.keys(contractsMap));
                        }
                    }
                } catch (e) {
                    console.error('[Yellow] Failed to parse config response:', e);
                }
            };

            ws.onerror = (err) => {
                console.error('[Yellow] WebSocket Error:', err);
            };

        } catch (e) {
            console.error('[Yellow] Failed to connect to ClearNode:', e);
        }

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, []);

    // SDK Init
    const nitrolite = useMemo(() => {
        if (!sepoliaConfig || !publicClient || !walletClient) {
            return null;
        }

        try {
            console.log('[Yellow] Initializing Nitrolite SDK...');
            return new NitroliteClient({
                chainId: sepoliaConfig.chainId,
                publicClient: publicClient as any,
                walletClient: walletClient as any,
                stateSigner: walletClient as any,
                addresses: sepoliaConfig.addresses,
                challengeDuration: BigInt(3600)
            });
        } catch (e) {
            console.error('[Yellow] SDK Instantiation Failed:', e);
            return null;
        }
    }, [sepoliaConfig, publicClient, walletClient]);


    /**
     * DEPOSIT (Real On-Chain Action)
     */
    const claimCreditsAndOpenChannel = useCallback(async (amountUSDC: string) => {
        if (!nitrolite) {
            alert("Nitrolite SDK not initialized. Please wait or switch networks.");
            return;
        }

        setChannelState('DEPOSITING');

        // 1. Enforce Sepolia Network
        if (chain?.id !== 11155111) {
            console.log('[HyperDrop] Switching to Sepolia for Deposit...');
            switchChain({ chainId: 11155111 });
            setChannelState('IDLE');
            return;
        }

        console.log(`[HyperDrop] Depositing ${amountUSDC} USDC to Nitrolite Custody...`);

        // 2. Real Deposit
        const amount = BigInt(Math.floor(parseFloat(amountUSDC) * 1000000)) || BigInt(1000);

        if (!sepoliaConfig) {
            throw new Error('Sepolia config not loaded');
        }
        const txHash = await nitrolite.deposit(sepoliaConfig.addresses.tokenAddress, amount);
        console.log('[HyperDrop] Deposit TX:', txHash);

        // Optimistic Credit Update
        const newCredits = Math.floor(parseFloat(amountUSDC) * 1000);
        setCredits(prev => prev + newCredits);

        const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setChannelId(`0x${randomHex}`);
        setChannelState('OPEN');

    }, [nitrolite, chain, switchChain]);

    // Utils
    const isWrongNetwork = channelState === 'OPEN' && chain?.id !== 11155111;

    /**
     * SIGN BID
     */
    const signBid = useCallback(async (bidAmountCredits: number) => {
        if (channelState !== 'OPEN' || !channelId || !nitrolite) {
            console.warn('[Yellow] Cannot sign bid: Channel/SDK not ready.');
            return;
        }

        if (chain?.id !== 11155111) {
            switchChain({ chainId: 11155111 });
            return;
        }

        if (credits < bidAmountCredits) {
            alert(`Insufficient Credits! You have ${credits}, need ${bidAmountCredits}.`);
            return;
        }

        try {
            setIsSigning(true);
            const bidAmountBigInt = BigInt(bidAmountCredits);

            const statePayload = {
                channelId: channelId as `0x${string}`,
                balance: bidAmountBigInt, // Current balance intent
                counterparty: sepoliaConfig?.addresses.guestAddress || '0x1111111111111111111111111111111111111111' as Address, // Real guestAddress
                nonce: BigInt(Date.now())
            };

            const domain = {
                name: 'Yellow Nitrolite',
                version: '1',
                chainId: 11155111,
                verifyingContract: sepoliaConfig?.addresses.adjudicator,
            } as const;

            const types = {
                State: [
                    { name: 'channelId', type: 'bytes32' },
                    { name: 'balance', type: 'uint256' },
                    { name: 'counterparty', type: 'address' },
                    { name: 'nonce', type: 'uint256' }
                ],
            } as const;

            if (!walletClient) throw new Error("No wallet");

            const signature = await walletClient.signTypedData({
                domain,
                types,
                primaryType: 'State',
                message: statePayload
            });

            console.log(`[Yellow] Real EIP-712 Signature (Sepolia):`, signature);
            setCredits(prev => prev - bidAmountCredits);

            setIsSigning(false);
            return signature;

        } catch (error) {
            console.error('[Yellow] Signing failed:', error);
            setIsSigning(false);
        }
    }, [nitrolite, channelState, channelId, chain, switchChain, credits, walletClient, sepoliaConfig]);

    // Auction Sync Helper
    const syncAuction = async (assetId: number, bidder?: string) => {
        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId, bidder })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Sync failed');
            return data.txHash;
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    };

    return {
        channelState,
        channelId,
        credits: Math.floor(credits),
        claimCreditsAndOpenChannel,
        signBid,
        syncAuction, // Export new function
        isSigning,
        isWrongNetwork
    };
}
