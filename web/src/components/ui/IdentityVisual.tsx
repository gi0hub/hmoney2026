'use client';

import { motion } from 'framer-motion';

interface IdentityVisualProps {
    id: number;
    domainRoot?: string; // Default: hyperdrop.eth
}

export function IdentityVisual({ id, domainRoot = "hyperdrop.eth" }: IdentityVisualProps) {
    const ensName = `${id}.${domainRoot}`;

    return (
        <div className="relative h-full w-full flex items-center justify-center p-4">
            {/* Holographic Card */}
            <motion.div
                initial={{ rotateY: 15, rotateX: 5 }}
                animate={{
                    rotateY: [15, -15, 15],
                    rotateX: [5, -5, 5],
                    y: [0, -10, 0]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-64 h-96 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col justify-between p-6 perspective-1000"
            >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-30 animate-pulse-slow pointer-events-none" />

                {/* Top: Branding */}
                <div className="flex justify-between items-start">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-glow">
                        HD
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
                        Genesis ID
                    </div>
                </div>

                {/* Center: The Identity */}
                <div className="flex flex-col items-center gap-2">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {id}
                    </div>
                    <div className="text-sm font-bold text-[var(--primary)] tracking-widest uppercase">
                        .{domainRoot}
                    </div>
                </div>

                {/* Bottom: Metadata */}
                <div className="space-y-2">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>RARITY</span>
                        <span className="text-white">TIER 1</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>OWNER</span>
                        <span className="text-white">0x00...00</span>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--primary)] opacity-10 blur-2xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-fuchsia-500 opacity-10 blur-2xl rounded-full" />
            </motion.div>

            {/* Reflection/Ground */}
            <div className="absolute bottom-10 w-48 h-4 bg-black/50 blur-xl rounded-full" />
        </div>
    );
}
