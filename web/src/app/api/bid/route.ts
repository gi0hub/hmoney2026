import { NextRequest, NextResponse } from 'next/server';
import { RelayerEngine } from '@/lib/relayer/engine';

const engine = new RelayerEngine();

export async function POST(req: NextRequest) {
    try {
        const { itemId, bidder, amount, signature } = await req.json();

        if (!itemId || !bidder || !amount || !signature) {
            return NextResponse.json({ error: 'missing fields' }, { status: 400 });
        }

        const { bidStore } = await import('@/lib/relayer/state');
        const currentHighest = bidStore.getHighestBid(Number(itemId));

        if (Number(amount) <= currentHighest) {
            return NextResponse.json({
                error: `Bid too low. Current highest is ${currentHighest}.`,
                currentHighest
            }, { status: 400 });
        }

        console.log(`[Bid] item=${itemId} user=${bidder} price=${amount}`);

        // Production note: Implement full EIP-712 verification here.

        const txHash = await engine.setWinnerOnChain(itemId, bidder);

        // Update Internal State Store
        bidStore.addBid(Number(itemId), bidder, Number(amount));

        return NextResponse.json({
            success: true,
            txHash: txHash
        });

    } catch (error: any) {
        console.error('[API/BID] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
