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

        // Optimistic Update: Mark as Settled & Ended (Moves to Sold Tab)
        setAuctionStates(prev => {
          const current = prev[selectedItemId];
          if (!current) return prev;

          const highestBid = current.bids[0];
          const winnerInfo = highestBid
            ? {
              id: highestBid.id,
              ens: highestBid.user,
              price: highestBid.amount,
              date: 'Just now',
              txHash: hash
            }
            : current.winner;

          return {
            ...prev,
            [selectedItemId]: {
              ...current,
              isSettled: true,
              isEnded: true, // Ensure it's marked ended to move to SOLD tab
              settlementTx: hash,
              winner: winnerInfo
            }
          };
        });
      },
      onError: (err) => {
        console.error(err);
        alert("Settlement Failed: " + err.message); // Type casting might be needed for TS strictness
      }
    });
  };

  // --- Independent Auction State Management ---
  type Bid = { id: string; user: string; amount: string; hash: string };
  type AuctionState = {
    bids: Bid[];
    winner?: { id: string; ens: string; price: string; date: string; txHash: string };
    isEnded: boolean;
    isSettled: boolean; // New: finalized on-chain
    settlementTx?: string; // New: tx hash
    endTime: number; // Persisted end time
  };

  const [auctionStates, setAuctionStates] = useState<Record<number, AuctionState>>({
    // Initial State including the "Used" Auction #3
    3: {
      bids: [
        { id: '1', user: 'Tester.eth', amount: '850 Credits', hash: '0x333' }
      ],
      isEnded: true,
      isSettled: true,
      settlementTx: '0x9c5991246ab77ebe00dd3a85ddb94f3e0e1e90751c94614ce58ab9b0d70cd52b',
      winner: { id: '3', ens: 'Tester.eth', price: '850 Credits', date: '1d ago', txHash: '0x333' },
      endTime: Date.now() - 10000 // Already ended
    },
    100: {
      bids: [
        { id: '1', user: 'GIorgio.eth', amount: '450 Credits', hash: '0x123' },
        { id: '2', user: 'Gambler.eth', amount: '500 Credits', hash: '0x456' },
      ],
      isEnded: false,
      isSettled: false,
      endTime: 0 // Will be set by effect if 0
    }
  });

  // --- Persistence Logic ---
  useEffect(() => {
    // 1. Load from LocalStorage
    try {
      const stored = localStorage.getItem('hyperdrop_auction_states');
      if (stored) {
        const parsed = JSON.parse(stored);

        // MIGRATION / ENFORCEMENT FIX:
        // Ensure Auction #3 always has the correct hardcoded settlement hash for this demo
        // even if local storage has the old "0xabc..." one.
        if (parsed[3]) {
          parsed[3].settlementTx = '0x9c5991246ab77ebe00dd3a85ddb94f3e0e1e90751c94614ce58ab9b0d70cd52b';
          parsed[3].isSettled = true; // Ensure it stays settled
        }

        setAuctionStates(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Failed to load auction states", e);
    }
  }, []);

  useEffect(() => {
    // 2. Save to LocalStorage
    if (Object.keys(auctionStates).length > 0) {
      localStorage.setItem('hyperdrop_auction_states', JSON.stringify(auctionStates));
    }
  }, [auctionStates]);

  // Helper to get current auction state safely
  const currentAuction = auctionStates[selectedItemId] || {
    bids: [],
    isEnded: false,
    isSettled: false,
    endTime: 0
  };

  // --- Persistent Timer Logic (Per Auction) ---
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // If it's the "Already Ended" auction (like #3), just lock it
    if (currentAuction.isEnded) {
      setTimeLeft(0);
      return;
    }

    const storageKey = `hyperdrop_auction_end_${selectedItemId}`;
    const storedEnd = localStorage.getItem(storageKey);
    let targetTime = currentAuction.endTime;

    // Initialize time if not set in state or storage
    if (targetTime === 0) {
      if (storedEnd) {
        targetTime = parseInt(storedEnd);
      } else {
        // 11 Days default for new visits
        const duration = 11 * 24 * 60 * 60 * 1000;
        targetTime = Date.now() + duration;
        localStorage.setItem(storageKey, targetTime.toString());
      }

      // Update State with confirmed time
      setAuctionStates(prev => {
        const existing = prev[selectedItemId] || {
          bids: [],
          isEnded: false,
          isSettled: false,
          winner: undefined,
          endTime: 0
        };

        return {
          ...prev,
          [selectedItemId]: { ...existing, endTime: targetTime }
        };
      });
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        // Mark as ended in state if not already
        if (!currentAuction.isEnded) {
          setAuctionStates(prev => {
            const existing = prev[selectedItemId] || {
              bids: [],
              isEnded: false,
              isSettled: false,
              winner: undefined,
              endTime: targetTime
            };
            return {
              ...prev,
              [selectedItemId]: { ...existing, isEnded: true }
            };
          });
        }
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedItemId, currentAuction.isEnded]); // Re-run when ID or Ended status changes

  // Demo: Force End Functionality
  const handleForceEnd = () => {
    const storageKey = `hyperdrop_auction_end_${selectedItemId}`;
    localStorage.setItem(storageKey, Date.now().toString());

    setAuctionStates(prev => {
      const existing = prev[selectedItemId] || {
        bids: [],
        isSettled: false,
        winner: undefined,
        // Explicitly setting ended state vars
        isEnded: true,
        endTime: Date.now()
      };

      return {
        ...prev,
        [selectedItemId]: {
          ...existing,
          isEnded: true,
          endTime: Date.now()
        }
      };
    });
  };

  // Mock History Logic (Global for now, but filtered by auction in real app)
  // For this demo, we can just show the winner if ended, or generic list
  const winnersList = Object.values(auctionStates)
    .filter(state => (state.isEnded || state.isSettled) && state.winner)
    .map(state => ({
      id: state.winner?.id || '0',
      ens: state.winner?.ens || 'Anon',
      price: state.winner?.price || '0 Credits',
      date: state.winner?.date || 'Recently',
      txHash: state.settlementTx || state.winner?.txHash || '0x'
    }))
    .reverse(); // Show newest first (roughly)

  // Use the derived list, fallback to some default if empty just for layout (optional)
  // or just show real ones.
  const displayWinners = winnersList.length > 0 ? winnersList : [];

  const handleSelectItem = (id: number) => {
    setSelectedItemId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Triggers the off-chain bidding process.
   */
  const handlePlaceBid = async (amount: number) => {
    if (!isConnected) {
      if (openConnectModal) openConnectModal();
      return;
    }
    if (chain?.id !== 11155111) {
      if (openChainModal) openChainModal();
      return;
    }
    if (channelState === 'IDLE' || channelState === 'DEPOSITING') {
      setIsTopUpOpen(true);
      return;
    }

    // Amount comes from UI input now
    const nextBid = amount;

    const signature = await signBid(nextBid);

    if (signature) {
      // Optimistic Update for THIS auction only
      const newBid = {
        id: Date.now().toString(),
        user: 'You (Anon)',
        amount: `${nextBid} Credits`,
        hash: '0xpending...'
      };

      setAuctionStates(prev => {
        const existing = prev[selectedItemId] || {
          bids: [],
          isEnded: false,
          isSettled: false,
          winner: undefined,
          endTime: 0
        };

        return {
          ...prev,
          [selectedItemId]: {
            ...existing,
            bids: [newBid, ...existing.bids]
          }
        };
      });
    }
  };

  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Determine Button Label
  let actionLabel = "Place Bid";
  if (!isConnected) actionLabel = "Connect Wallet";
  else if (chain?.id !== 11155111) actionLabel = "Switch to Sepolia";

  return (
    <main className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)] selection:text-black overflow-x-hidden relative">

      {/* 2. BACKGROUND LAYER */}
      <TradingBackground />

      {/* Dynamic Glows */}
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
            {currentAuction.isEnded ? (
              // Winner UI
              <div className="relative overflow-hidden rounded-3xl border border-[var(--primary)] bg-black/80 p-8 text-center backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <div className="absolute inset-0 bg-[var(--primary)]/10 animate-pulse" />
                <h3 className="relative z-10 text-2xl font-bold text-white mb-2">Auction Ended</h3>
                <p className="relative z-10 text-zinc-400 mb-6">Winner</p>

                <div className="relative z-10 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-white mb-8">
                  {currentAuction.bids[0]?.user || currentAuction.winner?.ens || "No Bids"}
                </div>

                <div className="relative z-10 flex flex-col gap-3">
                  <div className="text-sm text-zinc-500 font-mono">
                    Winning Bid: <span className="text-white">{currentAuction.bids[0]?.amount || currentAuction.winner?.price || "N/A"}</span>
                  </div>

                  {/* Settled vs Unsettled State */}
                  {currentAuction.isSettled ? (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="text-xs uppercase tracking-widest text-green-400 font-bold">
                        ✓ Settled on Chain
                      </div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${currentAuction.settlementTx}`}
                        target="_blank"
                        className="text-xs text-zinc-500 hover:text-white underline truncate"
                      >
                        Tx: {currentAuction.settlementTx}
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={handleSettle}
                      className="mt-4 w-full rounded-xl bg-white text-black font-bold py-3 hover:bg-zinc-200 transition-colors"
                    >
                      Execute Chain Settlement
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <AuctionCard
                itemId={selectedItemId.toString()}
                itemName={`Cyber-Tee #${selectedItemId}`}
                currentBid={(currentAuction.bids[0]?.amount || "500 Credits").replace(' Credits', '')}
                timeLeftSeconds={timeLeft}
                totalTimeSeconds={11 * 24 * 60 * 60}
                visual={<TShirtVisual number={selectedItemId} />}
                onPlaceBid={handlePlaceBid}
                isPlacingBid={isSigning}
                actionLabel={actionLabel}
                userCredits={credits}
              />
            )}
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div className="flex flex-col gap-8 lg:col-span-5 lg:pt-12">
          {/* Info Panel: Live Activity for THIS Auction */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
              Activity (#{selectedItemId})
            </h3>
            <div className="flex flex-col gap-4">
              {currentAuction.bids.length === 0 ? (
                <p className="text-zinc-500 italic text-sm">No bids yet. Be the first!</p>
              ) : (
                currentAuction.bids.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800" />
                      <div>
                        <p className="font-bold text-white">{b.user}</p>
                        <p className="text-xs text-[var(--primary)]">{b.amount}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600">Now</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <WinnerHistory winners={displayWinners} />
        </div>

        {/* Full Width Catalog */}
        <div className="lg:col-span-12 mt-12 mb-24">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
          <CatalogGrid
            onSelectItem={handleSelectItem}
            selectedId={selectedItemId}
            // Pass simple status map: ID -> 'live' | 'sold'
            itemStatuses={Object.fromEntries(
              Object.entries(auctionStates).map(([id, state]) => [id, state.isEnded ? 'sold' : 'live'])
            )}
          />
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
