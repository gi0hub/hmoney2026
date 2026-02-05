'use client';

import { useState, useEffect } from 'react';
import { AuctionCard } from '@/components/ui/AuctionCard';
import { TopUpSidebar } from '@/components/ui/TopUpSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { WinnerHistory } from '@/components/ui/WinnerHistory';
import { TradingBackground } from '@/components/ui/TradingBackground';
import { CatalogGrid } from '@/components/ui/CatalogGrid';
import { TShirtVisual } from '@/components/ui/TShirtVisual';
// import { IdentityVisual } from '@/components/ui/IdentityVisual'; // Kept for reference
import { Wallet } from 'lucide-react';
import { useYellowAuction } from '@/hooks/useYellowAuction';
// import { WalletConnect } from '@/components/ui/WalletConnect'; // Removed
import { ConnectButton, useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract } from 'wagmi';

export default function Home() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number>(100);

  const { isConnected, chain, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { writeContract } = useWriteContract();

  // Hook usage for gasless bidding - Hybrid Architecture
  const { channelState, channelId, credits, claimCreditsAndOpenChannel, signBid, isSigning, isWrongNetwork } = useYellowAuction();

  // ... (keeping timer logic context implicit by skipping lines) ...

  // Demo: Settle Logic (On-Chain)
  const handleSettle = () => {
    if (!address) return alert("Connect wallet to settle!");

    // ABI for settleAuction
    const abi = [{
      name: 'settleAuction',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'winner', type: 'address' },
        { name: 'assetId', type: 'uint256' },
        { name: 'subnameLabel', type: 'string' }
      ],
      outputs: []
    }];

    writeContract({
      address: '0xd46570ba76BD3F9A8A65f8B7882fFF890118E772',
      abi: abi,
      functionName: 'settleAuction',
      args: [address, BigInt(selectedItemId), selectedItemId.toString()],
    }, {
      onSuccess: (hash) => {
        alert(`Settlement Triggered! Tx: ${hash}`);
      },
      onError: (err) => {
        console.error(err);
        alert("Settlement Failed: " + err.message); // Type casting might be needed for TS strictness
      }
    });
  };

  // --- Persistent Timer Logic ---
  const [timeLeft, setTimeLeft] = useState(0);

  // Initialize or Load Timer
  useEffect(() => {
    const storageKey = `hyperdrop_auction_end_${selectedItemId}`;
    const storedEnd = localStorage.getItem(storageKey);
    let endTime: number;

    if (storedEnd) {
      endTime = parseInt(storedEnd);
    } else {
      // 11 Days in milliseconds
      const duration = 11 * 24 * 60 * 60 * 1000;
      endTime = Date.now() + duration;
      localStorage.setItem(storageKey, endTime.toString());
    }

    // Update function to calculate clean seconds remaining
    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft(0);
        setIsAuctionEnded(true);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
        setIsAuctionEnded(false);
      }
    };

    // Initial check
    updateTimer();

    // Interval
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [selectedItemId]);

  // Demo: Force End Auction
  const handleForceEnd = () => {
    const storageKey = `hyperdrop_auction_end_${selectedItemId}`;
    // Set end time to "Now" to effectively end it
    localStorage.setItem(storageKey, Date.now().toString());

    setTimeLeft(0);
    setIsAuctionEnded(true);
  };

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
    // 1. Wallet Check: Must be connected
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    // 2. Network Check: Must be on Sepolia for bidding
    if (chain?.id !== 11155111) {
      if (openChainModal) {
        openChainModal();
      }
      return;
    }

    // 3. Channel Check: Must have credits/channel open
    if (channelState === 'IDLE' || channelState === 'DEPOSITING') {
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

  // Demo State
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Determine Button Label
  let actionLabel = "Place Bid";
  if (!isConnected) actionLabel = "Connect Wallet";
  else if (chain?.id !== 11155111) actionLabel = "Switch to Sepolia";

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

        <div className="flex items-center gap-4">
          <ConnectButton showBalance={false} />

          <button
            onClick={() => setIsTopUpOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
          >
            <Wallet size={16} />
            <span>Credits: {credits}</span>
          </button>
        </div>
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
              <span className="text-[var(--primary)]">Cyber-Tee + Identity</span>
            </h1>
            <p className="max-w-md text-zinc-400">
              Limited Edition Physical Merch.
              Includes ownership of <strong>{selectedItemId}.hyperdrop.eth</strong>.
              <br />
              Authenticated on ENS.
            </p>
          </div>

          <div className="w-full max-w-md">
            {isAuctionEnded ? (
              // Winner UI
              <div className="relative overflow-hidden rounded-3xl border border-[var(--primary)] bg-black/80 p-8 text-center backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <div className="absolute inset-0 bg-[var(--primary)]/10 animate-pulse" />
                <h3 className="relative z-10 text-2xl font-bold text-white mb-2">Auction Ended</h3>
                <p className="relative z-10 text-zinc-400 mb-6">Winner</p>

                <div className="relative z-10 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-white mb-8">
                  {mockBids[0]?.user || "No Bids"}
                </div>

                <div className="relative z-10 flex flex-col gap-3">
                  <div className="text-sm text-zinc-500 font-mono">
                    Winning Bid: <span className="text-white">{mockBids[0]?.amount}</span>
                  </div>

                  {/* Operator Controls for Demo */}
                  <button
                    onClick={handleSettle}
                    className="mt-4 w-full rounded-xl bg-white text-black font-bold py-3 hover:bg-zinc-200 transition-colors"
                  >
                    Execute Chain Settlement
                  </button>
                </div>
              </div>
            ) : (
              <AuctionCard
                itemId={selectedItemId.toString()}
                itemName={`Cyber-Tee #${selectedItemId}`}
                currentBid={mockBids[0]?.amount.replace(' Credits', '') || "500"}
                timeLeftSeconds={timeLeft}
                totalTimeSeconds={600} // Mock total
                visual={<TShirtVisual number={selectedItemId} />}
                onPlaceBid={handlePlaceBid}
                isPlacingBid={isSigning}
                actionLabel={actionLabel}
              />
            )}
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

      {/* Demo Admin Panel */}
      <div className={`fixed bottom-4 right-4 z-50 transition-all ${showDemoPanel ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        <div className="bg-black/90 border border-zinc-700 rounded-lg p-4 shadow-2xl w-64">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Demo Controls</h4>
          <button
            onClick={handleForceEnd}
            className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold py-2 rounded hover:bg-red-500/20"
          >
            ⚠️ Force End Auction
          </button>
        </div>
      </div>

      {/* Demo Toggle */}
      <button
        onClick={() => setShowDemoPanel(!showDemoPanel)}
        className="fixed bottom-4 right-4 z-50 h-8 w-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
        title="Toggle Demo Panel"
      >
        ⚙️
      </button>

      <ToastProvider messages={[]} /* We can wire this to real events later */ />
    </main>
  );
}
