import { NextRequest, NextResponse } from 'next/server';
import { RelayerEngine } from '@/lib/relayer/engine';

const engine = new RelayerEngine();

export async function POST(req: NextRequest) {
    try {
        const { assetId, bidder } = await req.json();

        if (!assetId || !bidder) {
            return NextResponse.json({ error: 'missing fields' }, { status: 400 });
        }

        console.log(`[Sync] item=${assetId} user=${bidder}`);

        const txHash = await engine.setWinnerOnChain(assetId, bidder);

        return NextResponse.json({
            success: true,
            txHash: txHash
        });

    } catch (error: any) {
        console.error('[API/SYNC] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
