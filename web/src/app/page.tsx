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

  // Hook usage for gasless bidding - connecting the UI to the signing logic
  const { channelState, deposit, signBid, isSigning } = useYellowAuction();

  // Mock Data
  const [mockBids, setMockBids] = useState([
    { id: '1', user: 'GIorgio.eth', amount: '0.45 ETH', hash: '0x123' },
    { id: '2', user: 'Gambler.eth', amount: '0.50 ETH', hash: '0x456' },
  ]);

  // Mock History Logic (Should filter based on item in real app)
  const mockWinners = [
    { id: '101', ens: 'Pascal.eth', price: '0.9 ETH', date: '2h ago', txHash: '0xabc' },
    { id: '100', ens: 'Kartik.eth', price: '1.2 ETH', date: '5h ago', txHash: '0xdef' },
  ];

  const handleSelectItem = (id: number) => {
    setSelectedItemId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Triggers the off-chain bidding process.
   * We need to increment the current bid slightly for the signing payload.
   */
  const handlePlaceBid = async () => {
    // In a real scenario, check if channel is open, if not -> prompt deposit
    if (channelState === 'IDLE') {
      // Open sidebar to top up first
      setIsTopUpOpen(true);
      return;
    }

    // Propose a new bid (mock increment)
    await signBid('0.55');
    // Here we would optimistic update the UI or wait for the websocket confirmation
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
          <span>Credits: {channelState === 'OPEN' ? '1.00' : '0.00'} ETH</span>
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
              currentBid="0.50"
              timeLeftSeconds={45} // This would be dynamic
              totalTimeSeconds={300}
              visual={<TShirtVisual number={selectedItemId} />}
              onPlaceBid={handlePlaceBid}
              isPlacingBid={isSigning}
            />
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div className="flex flex-col gap-8 lg:col-span-5 lg:pt-12">
          {/* Info Panel */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Live Activity</h3>
            <div className="flex flex-col gap-4">
              {mockBids.slice(0, 2).map((b) => (
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
      <TopUpSidebar isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)}>
        <div className="flex h-full flex-col items-center justify-center text-center px-4">
          <h3 className="text-xl font-bold text-white mb-2">Top Up Channel</h3>
          <p className="text-zinc-400 mb-6 text-sm">
            Deposit funds to enable high-frequency gasless bidding.
          </p>

          {channelState === 'IDLE' && (
            <button
              onClick={() => deposit('1.0')}
              className="w-full rounded-xl bg-[var(--primary)] text-black font-bold py-3 hover:shadow-[0_0_20px_var(--primary-glow)] transition-all"
            >
              Deposit 1.0 ETH
            </button>
          )}

          {channelState === 'DEPOSITING' && (
            <div className="text-[var(--primary)] animate-pulse">Depositing on-chain... wait.</div>
          )}

          {channelState === 'OPEN' && (
            <div className="text-green-500 font-bold border border-green-500/20 bg-green-500/10 px-4 py-2 rounded-lg">
              Channel Open & Ready
            </div>
          )}
        </div>
      </TopUpSidebar>

      <ToastProvider messages={[]} /* We can wire this to real events later */ />
    </main>
  );
}
