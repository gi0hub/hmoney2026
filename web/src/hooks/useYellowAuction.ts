'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';

// --- Nitrolite SDK Mock Structure ---
// This mocks the @erc7824/nitrolite package structure
class NitroliteClientMock {
    chainId: number;

    constructor(config: { chainId: number }) {
        this.chainId = config.chainId;
    }

    // Mock functionality: In production, this verifies the deposit on the State Channel Contract
    async deposit(amount: bigint): Promise<{ balance: bigint }> {
        console.log(`[NitroliteSDK] Verifying deposit of ${amount} on Chain ${this.chainId}...`);
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { balance: amount };
    }

    // Strict EIP-712 Signing for Yellow Network
    async signState(
        walletClient: any,
        channelId: string,
        newBalance: bigint,
        counterparty: string
    ) {
        if (!walletClient) throw new Error("No wallet client");

        const domain = {
            name: 'Yellow Nitrolite',
            version: '1',
            chainId: this.chainId,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', // Mock Adjudicator
        } as const;

        const types = {
            State: [
                { name: 'channelId', type: 'bytes32' },
                { name: 'balance', type: 'uint256' },
                { name: 'counterparty', type: 'address' },
                { name: 'nonce', type: 'uint256' }
            ],
        } as const;

        const message = {
            channelId: channelId as `0x${string}`,
            balance: newBalance,
            counterparty: counterparty as `0x${string}`,
            nonce: BigInt(Date.now())
        };

        console.log('[NitroliteSDK] Requesting EIP-712 Signature for Sepolia:', message);

        return walletClient.signTypedData({
            domain,
            types,
            primaryType: 'State',
            message
        });
    }
}

export type ChannelState = 'IDLE' | 'DEPOSITING' | 'OPEN' | 'CLOSING';

export function useYellowAuction() {
    const { address, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { switchChain } = useSwitchChain();

    const [channelState, setChannelState] = useState<ChannelState>('IDLE');
    const [credits, setCredits] = useState<number>(0); // 1 Credit = 0.01 USDC
    const [channelId, setChannelId] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);

    // Initialize SDK Mock for Sepolia
    const nitrolite = useMemo(() => new NitroliteClientMock({ chainId: 11155111 }), []);

    /**
     * CLAIM CREDITS (The "Oracle" Step)
     * 1. Triggered after Li.Fi success on Base.
     * 2. Verifies amount (mock).
     * 3. Mints Credits (1 USDC = 100 Credits).
     * 4. Switches Network to Sepolia.
     */
    const claimCreditsAndOpenChannel = useCallback(async (amountUSDC: string) => {
        try {
            setChannelState('DEPOSITING');
            console.log(`[HyperDrop] Verifying ${amountUSDC} USDC on Base Mainnet...`);

            // 1. Calculate Credits: 0.20 USDC -> 20 Credits
            const usdcFloat = parseFloat(amountUSDC);
            const newCredits = Math.floor(usdcFloat * 100);

            // 2. Mock Deposit Verification
            await new Promise(resolve => setTimeout(resolve, 2000));
            setCredits(prev => prev + newCredits);

            // 3. Create/Resume Channel
            // In a real app, we'd derive channel ID from participants
            // 3. Create/Resume Channel
            // In a real app, we'd derive channel ID from participants
            // FIX: Must be exactly 32 bytes (64 hex chars) for EIP-712 strict checking
            const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            const mockChannelId = `0x${randomHex}`;
            setChannelId(mockChannelId);
            setChannelState('OPEN');

            console.log(`[HyperDrop] Minted ${newCredits} Credits. Channel Open.`);

            // 4. Prompt Network Switch to Sepolia if needed
            if (chain?.id !== 11155111) {
                console.log('[HyperDrop] Switching to Sepolia for Gameplay...');
                switchChain({ chainId: 11155111 });
            }

        } catch (error) {
            console.error('[HyperDrop] Claim failed:', error);
            setChannelState('IDLE');
        }
    }, [chain, switchChain]);

    // --- Network Enforcement (The "Casino Floor" Check) ---
    // Yellow operates on the execution layer (Sepolia). If user is on Base (Cashier), they must switch.
    const isWrongNetwork = channelState === 'OPEN' && chain?.id !== 11155111;

    /**
     * SIGN BID (The "Execution" Step - Nitrolite)
     * Uses strict EIP-712 signatures to push state updates off-chain.
     */
    const signBid = useCallback(async (bidAmountCredits: number) => {
        if (channelState !== 'OPEN' || !channelId) {
            console.warn('[Yellow] Channel not open.');
            return;
        }

        // Strict Flow Constraint: Block action if on Base
        if (chain?.id !== 11155111) {
            console.log('[Yellow] Wrong Network. Requesting Switch...');
            switchChain({ chainId: 11155111 });
            return;
        }

        // 4. Insufficient Funds Check
        if (credits < bidAmountCredits) {
            alert(`Insufficient Credits! You have ${credits}, need ${bidAmountCredits}.`);
            return;
        }

        try {
            setIsSigning(true);

            // New Balance calculation would happen here in a real state channel
            const bidAmountBigInt = BigInt(bidAmountCredits);

            let signature;
            if (walletClient) {
                // NITROLITE SDK: Using signTypedData (EIP-712)
                signature = await nitrolite.signState(
                    walletClient,
                    channelId,
                    bidAmountBigInt,
                    '0x1111111111111111111111111111111111111111'
                );
            } else {
                console.log("[Yellow] Demo Mode: Mocking Signature");
                await new Promise(resolve => setTimeout(resolve, 1000));
                signature = "0xmock_signature_demo";
            }

            console.log(`[Yellow] Bid Signed for Identity (Off-Chain):`, signature);
            setCredits(prev => prev - bidAmountCredits);

            setIsSigning(false);
            return signature;

        } catch (error) {
            console.error('[Yellow] Signing failed:', error);
            setIsSigning(false);
        }
    }, [walletClient, channelState, channelId, chain, switchChain, nitrolite]);

    return {
        channelState,
        channelId,
        credits,
        claimCreditsAndOpenChannel,
        signBid,
        isSigning,
        isWrongNetwork // Exposed for UI enforcement
    };
}
