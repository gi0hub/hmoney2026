import { NextResponse } from 'next/server';
import { RelayerEngine } from '@/lib/relayer/engine';

const engine = new RelayerEngine();

export async function GET() {
    try {
        const balances = await engine.getBalances();
        return NextResponse.json({
            status: 'healthy',
            balances: balances
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'unhealthy',
            error: error.message
        }, { status: 500 });
    }
}
