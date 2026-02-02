'use client';

import { useReadContract, useAccount } from 'wagmi';
import HyperDropABI from '@/abis/HyperDropProtocol.json';

// In a real scenario, this address would come from environment variables or deployment output
// For Hackathon, I might need to deploy first to get the address, 
// OR I use a placeholder if not deployed yet.
// I will use a placeholder const for now, meant to be updated.
export const HYPERDROP_CONTRACT_ADDRESS = '0x42f6d3dd4b5d8d2290d7420d5bc05bb7ca94a65f';

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
