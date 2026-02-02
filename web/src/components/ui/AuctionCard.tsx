'use client';

import { motion } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';

// ... imports
interface AuctionCardProps {
    itemId: string;
    itemName: string;
    currentBid: string;
    timeLeftSeconds: number;
    totalTimeSeconds: number;
    imageUrl?: string;
    visual?: React.ReactNode;
    onPlaceBid?: () => void;
    isPlacingBid?: boolean;
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
}: AuctionCardProps) {
    // Calculate progress percentage for the bar
    const progress = (timeLeftSeconds / totalTimeSeconds) * 100;

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
                            {currentBid} ETH
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                            <Timer size={14} className={isUrgent ? 'text-fuchsia-500' : 'text-zinc-400'} />
                            Time Left
                        </p>
                        <p className={`mt-1 text-xl font-bold ${isUrgent ? 'text-fuchsia-500' : 'text-white'}`}>
                            {Math.floor(timeLeftSeconds / 60)}m {timeLeftSeconds % 60}s
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onPlaceBid}
                    className="group relative mt-2 w-full overflow-hidden rounded-xl bg-white text-black transition-all hover:scale-[1.02] hover:bg-[var(--primary)] hover:shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    disabled={timeLeftSeconds <= 0 || isPlacingBid}
                >
                    {isPlacingBid ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            <span className="text-sm font-bold uppercase tracking-widest">Signing...</span>
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest">
                            Place Bid
                        </div>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
