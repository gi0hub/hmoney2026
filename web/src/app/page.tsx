'use client';

import { useState } from 'react';
import { AuctionCard } from '@/components/ui/AuctionCard';
import { TopUpSidebar } from '@/components/ui/TopUpSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { WinnerHistory } from '@/components/ui/WinnerHistory';
import { TradingBackground } from '@/components/ui/TradingBackground';
import { CatalogGrid } from '@/components/ui/CatalogGrid';
import { TShirtVisual } from '@/components/ui/TShirtVisual';
import { Wallet } from 'lucide-react';
import { useYellowAuction } from '@/hooks/useYellowAuction';

export default function Home() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number>(100); // Default to item 100 or 1

  // Hook usage for gasless bidding - Hybrid Architecture
  const { channelState, channelId, credits, claimCreditsAndOpenChannel, signBid, isSigning, isWrongNetwork } = useYellowAuction();

  // Mock Data (Credits)
  const [mockBids, setMockBids] = useState([
    { id: '1', user: 'GIorgio.eth', amount: '450 Credits', hash: '0x123' },
    { id: '2', user: 'Gambler.eth', amount: '500 Credits', hash: '0x456' },
  ]);

  // Mock History Logic
  const mockWinners = [
    { id: '101', ens: 'Pascal.eth', price: '900 Credits', date: '2h ago', txHash: '0xabc' },
    { id: '100', ens: 'Kartik.eth', price: '1200 Credits', date: '5h ago', txHash: '0xdef' },
  ];

  const handleSelectItem = (id: number) => {
    setSelectedItemId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Triggers the off-chain bidding process.
   */
  const handlePlaceBid = async () => {
    // In a real scenario, check if channel is open, if not -> prompt deposit
    if (channelState === 'IDLE' || channelState === 'DEPOSITING') {
      // Open sidebar to top up first
      setIsTopUpOpen(true);
      return;
    }

    // Propose a new bid (Current Highest + 50 Credits)
    // In a real app, strict validation against the latest state
    const currentHighest = parseInt(mockBids[0]?.amount.replace(' Credits', '') || "500");
    const nextBid = currentHighest + 50;

    const signature = await signBid(nextBid);

    if (signature) {
      // Optimistic Update
      const newBid = {
        id: Date.now().toString(),
        user: 'You (Anon)', // Or derive from address
        amount: `${nextBid} Credits`,
        hash: '0xpending...'
      };
      setMockBids([newBid, ...mockBids]);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)] selection:text-black overflow-x-hidden relative">

      {/* 2. BACKGROUND LAYER */}
      <TradingBackground />

      {/* Dynamic Glows (framer-motion friendly CSS) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[var(--primary)] opacity-[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-fuchsia-600 opacity-[0.05] blur-[150px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--primary)] box-shadow-glow" />
          <span className="font-mono text-xl font-bold tracking-tighter text-white">
            HYPER<span className="text-[var(--primary)]">DROP</span>
          </span>
        </div>

        <button
          onClick={() => setIsTopUpOpen(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
        >
          <Wallet size={16} />
          <span>Credits: {credits}</span>
        </button>
      </nav>

      {/* Main Layout */}
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 lg:grid-cols-12">

        {/* Left Col: Hero Auction */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl text-shadow-glow">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                Item #{selectedItemId.toString().padStart(3, '0')}
              </span>
              <br />
              <span className="text-[var(--primary)]">Cyber-Tee v3</span>
            </h1>
            <p className="max-w-md text-zinc-400">
              Limited edition physical merch with serigraphed ENS.
              Authenticity verified on-chain.
            </p>
          </div>

          <div className="w-full max-w-md">
            <AuctionCard
              itemId={selectedItemId.toString()}
              itemName={`Cyber-Tee v3 #${selectedItemId}`}
              currentBid={mockBids[0]?.amount.replace(' Credits', '') || "500"}
              timeLeftSeconds={45} // This would be dynamic
              totalTimeSeconds={300}
              visual={<TShirtVisual number={selectedItemId} />}
              onPlaceBid={handlePlaceBid}
              isPlacingBid={isSigning}
              actionLabel={isWrongNetwork ? "Switch to Sepolia" : "Place Bid"}
            />
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div className="flex flex-col gap-8 lg:col-span-5 lg:pt-12">
          {/* Info Panel */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Live Activity</h3>
            <div className="flex flex-col gap-4">
              {mockBids.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800" />
                    <div>
                      <p className="font-bold text-white">Bid by {b.user}</p>
                      <p className="text-xs text-[var(--primary)]">{b.amount}</p>
                    </div>
                  </div>
                  <a href="#" className="text-xs text-zinc-600 hover:text-white transition-colors">View Tx</a>
                </div>
              ))}
            </div>
          </div>

          <WinnerHistory winners={mockWinners} />
        </div>

        {/* Full Width Catalog */}
        <div className="lg:col-span-12 mt-12 mb-24">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
          <CatalogGrid onSelectItem={handleSelectItem} selectedId={selectedItemId} />
        </div>

      </div>

      {/* Overlays */}
      <TopUpSidebar
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onOpenChannel={(amount) => claimCreditsAndOpenChannel(amount)}
      />

      <ToastProvider messages={[]} /* We can wire this to real events later */ />
    </main>
  );
}
