'use client';

import { motion } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

// ... imports
interface AuctionCardProps {
    itemId: string;
    itemName: string;
    currentBid: string;
    timeLeftSeconds: number;
    totalTimeSeconds: number;
    imageUrl?: string;
    visual?: React.ReactNode;
    onPlaceBid?: (amount: number) => void;
    isPlacingBid?: boolean;
    actionLabel?: string;
    userCredits?: number; // Optional access to user balance
}

export function AuctionCard({
    itemId,
    itemName,
    currentBid,
    timeLeftSeconds,
    totalTimeSeconds,
    imageUrl = "https://placehold.co/600x400/1a1a1a/06b6d4?text=Exclusive+Merch",
    visual,
    onPlaceBid,
    isPlacingBid = false,
    actionLabel = "Place Bid",
    userCredits,
}: AuctionCardProps) {
    // Calculate progress percentage for the bar
    const progress = (timeLeftSeconds / totalTimeSeconds) * 100;

    // State for custom bid amount
    const currentBidVal = parseInt(currentBid.replace(/,/g, '').replace(' Credits', '') || '0');
    const nextMinBid = currentBidVal + 50;

    // We utilize a simple string state to handle empty inputs gracefully
    const [bidAmountStr, setBidAmountStr] = useState<string>(nextMinBid.toString());

    // Sync state if currentBid changes exogenously (e.g. someone else bids)
    useEffect(() => {
        setBidAmountStr((prev) => {
            const current = parseInt(prev || '0');
            // If the current entered bid is now invalid (too low), bump it? 
            // Or just let validation handle it. Let's auto-bump if it's the default minimum.
            if (current < nextMinBid) return nextMinBid.toString();
            return prev;
        });
    }, [nextMinBid]);

    const bidVal = parseInt(bidAmountStr || '0');
    const isValidAmount = bidVal >= nextMinBid;
    const canAfford = userCredits !== undefined ? userCredits >= bidVal : true;

    let buttonText = actionLabel;
    let isButtonDisabled = isPlacingBid || timeLeftSeconds <= 0;
    let warningText = "";

    if (actionLabel === "Place Bid") {
        if (!isValidAmount) {
            buttonText = `Min Bid: ${nextMinBid}`;
            isButtonDisabled = true;
        } else if (!canAfford) {
            buttonText = "Insufficient Credits";
            isButtonDisabled = true;
            warningText = `Required: ${bidVal} Credits. You have ${userCredits}.`;
        }
    }

    // Decide color based on tension (time left)
    const isUrgent = timeLeftSeconds < 60;
    const barColor = isUrgent ? 'bg-fuchsia-600' : 'bg-[var(--primary)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-white/20
        ${timeLeftSeconds > 0 ? 'animate-pulse-glow' : ''}
      `}
        >
            {/* Image Section */}
            <div className="relative h-64 w-full bg-zinc-900/50 flex items-center justify-center overflow-hidden">
                {visual ? (
                    <div className="w-full h-full p-8 transform hover:scale-105 transition-transform duration-500">
                        {visual}
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt={itemName}
                        className="h-full w-full object-cover opacity-80 transition-opacity duration-300 hover:opacity-100"
                    />
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md z-10">
                    <span className={`h-2 w-2 rounded-full ${timeLeftSeconds > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {timeLeftSeconds > 0 ? 'Live Auction' : 'Ended'}
                </div>
            </div>

            {/* Tension Progress Bar */}
            <div className="h-1 w-full bg-white/5">
                <motion.div
                    className={`h-full ${barColor} shadow-[0_0_10px_currentColor]`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 1 }} // Smooth decrease if updated often
                />
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-4 p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">{itemName}</h2>
                    <p className="text-sm font-medium text-zinc-400">ID: #{itemId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                            <Zap size={14} className="text-[var(--primary)]" />
                            Current Bid
                        </p>
                        <p className="mt-1 text-xl font-bold text-[var(--primary)] text-shadow-glow">
                            {currentBid} Credits
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                            <Timer size={14} className={isUrgent ? 'text-fuchsia-500' : 'text-zinc-400'} />
                            Time Left
                        </p>
                        <p className={`mt-1 text-xl font-bold ${isUrgent ? 'text-fuchsia-500' : 'text-white'}`}>
                            {formatTime(timeLeftSeconds)}
                        </p>
                    </div>
                </div>

                {/* Bid Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                        Your Bid Amount
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={bidAmountStr}
                            onChange={(e) => setBidAmountStr(e.target.value)}
                            min={nextMinBid}
                            className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-lg font-bold text-white placeholder-zinc-700 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                            placeholder={nextMinBid.toString()}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-bold pointer-events-none">
                            CREDITS
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => onPlaceBid && onPlaceBid(bidVal)}
                    className="group relative mt-2 w-full overflow-hidden rounded-xl bg-white text-black transition-all hover:scale-[1.02] hover:bg-[var(--primary)] hover:shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    disabled={isButtonDisabled}
                >
                    {isPlacingBid ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            <span className="text-sm font-bold uppercase tracking-widest">Signing...</span>
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest">
                            {buttonText}
                        </div>
                    )}
                </button>
                {warningText && (
                    <p className="text-center text-xs text-red-400">
                        {warningText}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

function formatTime(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
}
