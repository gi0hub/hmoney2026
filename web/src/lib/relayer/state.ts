// Simple singleton to hold bid state in memory
// Scalability note: Replace with external cache for distributed deploys.
export type BidRecord = {
    user: string;
    amount: number;
    timestamp: number;
};

class BidStore {
    private static instance: BidStore;
    private state: Record<number, BidRecord[]> = {};

    private constructor() { }

    public static getInstance(): BidStore {
        if (!BidStore.instance) {
            BidStore.instance = new BidStore();
        }
        return BidStore.instance;
    }

    public addBid(itemId: number, bidder: string, amount: number) {
        if (!this.state[itemId]) this.state[itemId] = [];

        // Prevent duplicate record if needed, but for now just push
        this.state[itemId].unshift({
            user: bidder,
            amount: amount,
            timestamp: Date.now()
        });

        // Keep only last 10
        if (this.state[itemId].length > 10) {
            this.state[itemId] = this.state[itemId].slice(0, 10);
        }
    }

    public getBids(itemId: number): BidRecord[] {
        return this.state[itemId] || [];
    }

    public getHighestBid(itemId: number): number {
        const bids = this.getBids(itemId);
        if (bids.length === 0) return 0;
        return bids[0].amount;
    }
}

export const bidStore = BidStore.getInstance();
