'use client';

import { useState, useEffect } from 'react';
import { AuctionCard } from '@/components/ui/AuctionCard';
import { TopUpSidebar } from '@/components/ui/TopUpSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { WinnerHistory } from '@/components/ui/WinnerHistory';
import { TradingBackground } from '@/components/ui/TradingBackground';
import { CatalogGrid } from '@/components/ui/CatalogGrid';
import { GlitchText } from '@/components/ui/GlitchText';
import { Marquee } from '@/components/ui/Marquee';
import { TShirtVisual } from '@/components/ui/TShirtVisual';
import { Wallet } from 'lucide-react';
import { useYellowAuction } from '@/hooks/useYellowAuction';

import { ConnectButton, useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useToast } from '@/components/ui/ToastSystem';
import { ErrorMessages, SuccessMessages, parseContractError } from '@/lib/errorMessages';

export default function Home() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number>(11);
  const [isForceEnding, setIsForceEnding] = useState(false);
  const [isRelayerProcessing, setIsRelayerProcessing] = useState(false);
  const [isBidLocked, setIsBidLocked] = useState(false);

  const { isConnected, chain, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { writeContract } = useWriteContract();
  const toast = useToast();

  // Chain Read Hooks
  const { data: onChainEndTime } = useReadContract({
    address: '0x1f159842b08Dac10340D358eF3c2B7e15434d9A0',
    abi: [{
      name: 'auctionEndTimes',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'assetId', type: 'uint256' }],
      outputs: [{ name: '', type: 'uint256' }]
    }],
    functionName: 'auctionEndTimes',
    args: [BigInt(selectedItemId)],
  });

  const { channelState, channelId, credits, claimCreditsAndOpenChannel, signBid, syncAuction, isSigning, isWrongNetwork } = useYellowAuction();

  // Settlement logic
  const handleSettle = () => {
    if (!address) {
      toast.warning(ErrorMessages.WALLET_NOT_CONNECTED.title, ErrorMessages.WALLET_NOT_CONNECTED.message);
      return;
    }

    // ABI for settleAuction (new public version - winner determined by contract)
    const abi = [{
      name: 'settle',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'assetId', type: 'uint256' },
        { name: 'label', type: 'string' }
      ],
      outputs: []
    }];

    writeContract({
      address: '0x1f159842b08Dac10340D358eF3c2B7e15434d9A0',
      abi: abi,
      functionName: 'settle',
      args: [BigInt(selectedItemId), selectedItemId.toString()],
    }, {
      onSuccess: (hash) => {
        toast.success(
          SuccessMessages.SETTLEMENT_SUCCESS.title,
          SuccessMessages.SETTLEMENT_SUCCESS.message
        );

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
        const { title, message } = parseContractError(err);
        toast.error(title, message);
      }
    });
  };

  // Auction State Management
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
    3: {
      bids: [
        { id: '1', user: 'Tester.eth', amount: '850 Credits', hash: '0x333' }
      ],
      isEnded: false,
      isSettled: false,
      endTime: 0
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

  // Persistence
  useEffect(() => {
    const storageKey = 'hyperdrop_auction_states_v3';

    const loadAuthStates = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setAuctionStates(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to load auction states", e);
      }
    };

    loadAuthStates();

    // Listen for changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAuctionStates(prev => ({ ...prev, ...parsed }));
        } catch { }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (Object.keys(auctionStates).length > 0) {
      localStorage.setItem('hyperdrop_auction_states_v3', JSON.stringify(auctionStates));
    }
  }, [auctionStates]);

  // Real-Time Sync
  useEffect(() => {
    let abandoned = false;
    const poll = async () => {
      if (abandoned) return;
      try {
        const res = await fetch(`/api/status?itemId=${selectedItemId}`);
        const data = await res.json();
        if (abandoned) return;

        if (data.success && data.bids.length > 0) {
          setAuctionStates(prev => {
            const current = prev[selectedItemId];
            // Only update if the latest bid ID is different to avoid flickering
            if (current && current.bids.length > 0 && current.bids[0].id === data.bids[0].id) {
              return prev;
            }
            return {
              ...prev,
              [selectedItemId]: {
                ...(current || { isEnded: false, isSettled: false, endTime: 0 }),
                bids: data.bids
              }
            };
          });
        }
      } catch (e) {
        // console.debug('Polling wait...');
      }
    };

    const interval = setInterval(poll, 1500); // More aggressive polling (1.5s)
    poll();
    return () => {
      abandoned = true;
      clearInterval(interval);
    };
  }, [selectedItemId]);

  // Helper to get current auction state safely
  const currentAuction = auctionStates[selectedItemId] || {
    bids: [],
    isEnded: false,
    isSettled: false,
    endTime: 0
  };

  // Auction Timer Logic
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
    if (onChainEndTime && Number(onChainEndTime) > 0) {
      targetTime = Number(onChainEndTime) * 1000;
      localStorage.setItem(storageKey, targetTime.toString());
    } else if (targetTime === 0) {
      if (storedEnd) {
        targetTime = parseInt(storedEnd);
      } else {
        // Fallback: 11 Days default for new visits
        const duration = 11 * 24 * 60 * 60 * 1000;
        targetTime = Date.now() + duration;
        localStorage.setItem(storageKey, targetTime.toString());
      }
    }
    // Update State with confirmed time
    // This block should run if targetTime was initialized or updated
    if (targetTime !== currentAuction.endTime) { // Only update state if targetTime actually changed
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
  }, [selectedItemId, currentAuction.isEnded, onChainEndTime]); // Re-run when ID or Ended status changes

  // Force end functionality
  const handleForceEnd = async (itemId: number) => {
    // 1. Sync the current winner to chain first (if any)
    if (currentAuction.winner) {
      try {
        setIsRelayerProcessing(true);
        toast.info("Syncing Bid", "Ensuring winner is on-chain...");
        // @ts-ignore
        await syncAuction(itemId, currentAuction.winner.ens || currentAuction.winner.user || currentAuction.winner.id);
        setIsRelayerProcessing(false);
      } catch (e) {
        console.error("Sync failed", e);
        setIsRelayerProcessing(false);
        // Optional: abort or warn? For now, we warn but proceed so user isn't stuck
        toast.warning("Sync Failed", "Proceeding with force end...");
      }
    }

    const forceEndAbi = [{
      name: 'forceEndAuction',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'assetId', type: 'uint256' }],
      outputs: []
    }];

    writeContract({
      address: '0x1f159842b08Dac10340D358eF3c2B7e15434d9A0',
      abi: forceEndAbi,
      functionName: 'forceEndAuction',
      args: [BigInt(itemId)],
    }, {
      onSuccess: () => {
        setIsForceEnding(true); // Start visual loading state
        setIsBidLocked(true); // Lock bidding
        toast.info("Transaction Sent", "Waiting ~15s for confirmation...");

        // Wait 15 seconds for the transaction to be mined
        setTimeout(() => {
          setIsForceEnding(false); // Stop visual loading
          toast.success("Auction Ended", "You can now settle");
          const storageKey = `hyperdrop_auction_end_${itemId}`;
          localStorage.setItem(storageKey, Date.now().toString());

          setAuctionStates(prev => ({
            ...prev,
            [itemId]: {
              ...(prev[itemId] || { bids: [], isSettled: false, winner: undefined }),
              isEnded: true,
              endTime: Date.now()
            }
          }));

          // Extended lock to prevent bugs during transition
          setTimeout(() => setIsBidLocked(false), 4000);
        }, 15000);
      },
      onError: (err) => {
        setIsForceEnding(false);
        setIsBidLocked(false);
        toast.error("Force end failed", err.message);
      }
    });
  };

  // History Logic (Global for now, filtered by auction)
  const winnersList = Object.values(auctionStates)
    .filter(state => (state.isEnded || state.isSettled) && state.winner)
    .map(state => ({
      id: state.winner?.id || '0',
      ens: (() => {
        // @ts-ignore
        const raw = state.winner?.ens || state.winner?.user || 'Anon';
        if (raw === 'You (Anon)' && raw.toLowerCase() !== address?.toLowerCase()) return 'Anon';
        return raw.toLowerCase() === address?.toLowerCase() ? 'You' : 'Anon';
      })(),
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

  const handlePlaceBid = async (amount: number) => {
    if (isBidLocked || isForceEnding) {
      toast.error("Process Pending", "Please wait a moment...");
      return;
    }
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

    const nextBid = amount;

    const signature = await signBid(nextBid);

    if (signature) {
      try {
        const response = await fetch('/api/bid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedItemId,
            bidder: address,
            amount: nextBid,
            signature
          })
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error("Bid Failed", data.error || "Unknown error");
          // If the error was specifically "too low", we might want to refresh state immediately
          return;
        }

        const newBid = {
          id: Date.now().toString(),
          user: address || 'Anon',
          amount: `${nextBid} Credits`,
          hash: data.txHash || '0xpending...'
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
      } catch (e) {
        console.error('Bid error:', e);
        toast.error("Bid Error", "Could not reach relayer");
      }

      // Safety: Lock admin actions for 15s to allow Relayer to mine Init/SetWinner txs
      setIsRelayerProcessing(true);
      setTimeout(() => setIsRelayerProcessing(false), 15000);
    }
  };

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Determine Button Label
  let actionLabel = "Place Bid";
  if (!isConnected) actionLabel = "Connect Wallet";
  else if (chain?.id !== 11155111) actionLabel = "Switch to Sepolia";



  return (
    <main className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)] selection:text-black overflow-x-hidden relative">
      {/* 2. BACKGROUND LAYER */}
      <TradingBackground />
      <div className="bg-noise" /> {/* Global Texture */}

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
            <GlitchText text="HYPERDROP" />
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

                <div className="relative z-10 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-white mb-8 flex justify-center text-center">
                  {(() => {
                    // @ts-ignore
                    const raw = currentAuction.bids[0]?.user || currentAuction.winner?.ens || currentAuction.winner?.user || "No Bids";
                    return raw.toLowerCase() === address?.toLowerCase() ? 'You' : 'Anon';
                  })()}
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
                    (currentAuction.bids.length > 0 || currentAuction.winner) ? (
                      <button
                        onClick={handleSettle}
                        className="mt-4 w-full rounded-xl bg-white text-black font-bold py-3 hover:bg-zinc-200 transition-colors"
                      >
                        Execute Chain Settlement
                      </button>
                    ) : (
                      <div className="mt-4 w-full rounded-xl bg-zinc-800 text-zinc-500 font-bold py-3 cursor-not-allowed text-center">
                        No Bids - Cannot Settle
                      </div>
                    )
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
                isPlacingBid={isSigning || isBidLocked}
                actionLabel={isBidLocked ? "Locking..." : actionLabel}
                userCredits={credits}
                setIsTopUpOpen={setIsTopUpOpen}
              />
            )}
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div className="flex flex-col gap-8 lg:col-span-5 lg:pt-12">
          {/* Info Panel: Live Activity for THIS Auction */}
          <div className="w-full rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
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
                        <p className="font-bold text-white">
                          {(() => {
                            const userStr = b.user || 'Anon';
                            return userStr.toLowerCase() === address?.toLowerCase() ? 'You' : 'Anon';
                          })()}
                        </p>
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
        onOpenChannel={async (amount) => {
          try {
            await claimCreditsAndOpenChannel(amount);
            setIsTopUpOpen(false);
            toast.success("Credits Added", "Channel Opened Successfully");
          } catch (e: any) {
            console.error(e);
            let msg = e.message || "Checking balance or approval failed";
            if (msg.includes("simulation")) msg = "Insufficient USDC or Approval needed";
            toast.error("Deposit Failed", msg);
          }
        }}
      />

      {/* Admin Panel */}
      <div className={`fixed bottom-4 right-4 z-50 transition-all ${showAdminPanel ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        <div className="bg-black/90 border border-zinc-700 rounded-lg p-4 shadow-2xl w-64">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Controls</h4>

          {onChainEndTime && Number(onChainEndTime) > 0 ? (
            <button
              onClick={() => handleForceEnd(selectedItemId)}
              disabled={isForceEnding || isRelayerProcessing}
              className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold py-2 rounded hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-wait">
              {isRelayerProcessing ? 'Syncing Bid (~15s)...' : (isForceEnding ? 'Processing (~15s)...' : 'Force End Auction')}
            </button>
          ) : (
            <div className="text-xs text-zinc-500 text-center py-2 h-8 flex items-center justify-center">
              Auction Not Started
            </div>
          )}
        </div>
      </div>

      {/* Admin Toggle */}
      <button
        onClick={() => setShowAdminPanel(!showAdminPanel)}
        className="fixed bottom-4 right-4 z-50 h-8 w-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
        title="Toggle Admin Panel"
      >
        ⚙️
      </button>

      <ToastProvider messages={[]} /* We can wire this to real events later */ />

      {/* Live Winners Marquee */}
      <div className="fixed bottom-0 w-full z-40 pointer-events-none">
        <Marquee winners={[
          // Real winners first
          ...displayWinners,
          // Legacy Hall of Fame winners
          { id: '88', ens: 'Kartik.eth', price: '450 Credits', txHash: '0x' },
          { id: '89', ens: 'Pascal.eth', price: '500 Credits', txHash: '0x' },
          { id: '90', ens: 'GIorgio.eth', price: '550 Credits', txHash: '0x' },
          { id: '91', ens: 'Pepe.eth', price: '600 Credits', txHash: '0x' },
          { id: '92', ens: 'Vitalik.eth', price: '1000 Credits', txHash: '0x' }
        ]} />
      </div>
    </main >
  );
}
