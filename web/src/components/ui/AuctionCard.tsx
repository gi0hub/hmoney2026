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
    setIsTopUpOpen?: (open: boolean) => void; // For Top Up button
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
    setIsTopUpOpen,
    isPlacingBid = false,
    actionLabel = "Place Bid",
    userCredits,
}: AuctionCardProps) {
    // Progress calculation
    const progress = (timeLeftSeconds / totalTimeSeconds) * 100;

    // Bid amount state
    const currentBidVal = parseInt(currentBid.replace(/,/g, '').replace(' Credits', '') || '0');
    const nextMinBid = currentBidVal + 50;

    // String state for input handling
    const [bidAmountStr, setBidAmountStr] = useState<string>(nextMinBid.toString());

    // Sync on external updates
    useEffect(() => {
        setBidAmountStr((prev) => {
            const current = parseInt(prev || '0');
            // Auto-bump if current is lower than minimum
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

    // State-based coloring
    const isUrgent = timeLeftSeconds < 60;
    const barColor = isUrgent ? 'bg-fuchsia-600' : 'bg-[var(--primary)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-500 hover:border-[var(--primary)] hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] group
        ${timeLeftSeconds > 0 ? 'animate-pulse-glow shadow-[0_0_15px_rgba(0,240,255,0.1)]' : ''}
      `}
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {/* Image Section */}
            <div className="relative h-64 w-full flex items-center justify-center overflow-hidden">
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

            {/* Progress bar */}
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
                    <div className="mt-3 overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-600/10 p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Credit Balance</span>
                            <button
                                onClick={() => setIsTopUpOpen && setIsTopUpOpen(true)}
                                className="text-xs font-bold text-[var(--primary)] hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Zap size={12} />
                                Top Up
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 mb-3">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-500 to-red-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((userCredits || 0) / bidVal) * 100, 100)}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>

                        {/* Credits Info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">You have:</span>
                                    <span className="font-bold text-white">{userCredits || 0}</span>
                                </div>
                                <span className="text-zinc-600">/</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">Required:</span>
                                    <span className="font-bold text-red-400">{bidVal}</span>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-red-400">
                                -{bidVal - (userCredits || 0)} short
                            </span>
                        </div>
                    </div>
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
