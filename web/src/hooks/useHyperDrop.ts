'use client';

import { useReadContract, useAccount } from 'wagmi';
import HyperDropABI from '@/abis/HyperDropProtocol.json';

export const HYPERDROP_CONTRACT_ADDRESS = '0x1f159842b08Dac10340D358eF3c2B7e15434d9A0';

export function useHyperDrop(itemId: string) {
    const { address } = useAccount();

    // Check if the connected user owns the item
    const { data: balance, isLoading, isError } = useReadContract({
        address: HYPERDROP_CONTRACT_ADDRESS,
        abi: HyperDropABI,
        functionName: 'balanceOf',
        args: address ? [address, BigInt(itemId)] : undefined,
        query: {
            enabled: !!address,
        }
    });

    return {
        isOwner: balance ? Number(balance) > 0 : false,
        balance: balance ? Number(balance) : 0,
        isLoading,
        isError
    };
}
