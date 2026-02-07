import { NextRequest, NextResponse } from 'next/server';
import { bidStore } from '@/lib/relayer/state';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json({ error: 'missing itemId' }, { status: 400 });
        }

        const bids = bidStore.getBids(Number(itemId));

        return NextResponse.json({
            success: true,
            itemId: Number(itemId),
            bids: bids.map(b => ({
                id: `${b.timestamp}-${b.user}`,
                user: b.user,
                amount: `${b.amount} Credits`
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
