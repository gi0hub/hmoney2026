'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ClientOnly } from '../ClientOnly';
import { useState } from 'react';

interface TopUpSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenChannel?: (amount: string) => void;
}

export function TopUpSidebar({ isOpen, onClose, onOpenChannel }: TopUpSidebarProps) {
    const [amount, setAmount] = useState('5'); // Default amount

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (Dimmed) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-black/90 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 p-6 shrink-0">
                            <h2 className="text-xl font-bold tracking-tight text-white">
                                <span className="text-[var(--primary)]">Top Up</span> Credits
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            <ClientOnly>
                                <div className="space-y-6">
                                    {/* Info Card */}
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                        <h3 className="text-sm font-bold text-white mb-2">Sepolia Testnet</h3>
                                        <p className="text-xs text-zinc-400">
                                            Deposit USDC to bid on auctions.
                                            <br />
                                            Funds are held in the Yellow Nitrolite custody contract.
                                        </p>
                                    </div>

                                    {/* Deposit Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Amount</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-2xl font-mono text-white focus:outline-none focus:border-[var(--primary)] focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300 placeholder:text-zinc-700"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <span className="text-sm font-bold text-zinc-400">USDC</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {['5', '10', '15'].map((val) => (
                                                <button
                                                    key={val}
                                                    onClick={() => setAmount(val)}
                                                    className="px-3 py-1 text-xs font-mono rounded-md bg-white/5 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] hover:border-[var(--primary)] border border-white/5 transition-all duration-300"
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => {
                                            if (onOpenChannel) onOpenChannel(amount);
                                        }}
                                        className="w-full relative group overflow-hidden rounded-xl bg-[var(--primary)] text-black font-bold py-4 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_var(--primary-glow)]"
                                    >
                                        <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="relative z-10 flex items-center justify-center gap-2 font-mono uppercase tracking-wider">
                                            Deposit & Open Channel
                                        </span>
                                    </button>

                                    <div className="text-center">
                                        <p className="text-[10px] text-zinc-600">
                                            Requires Sepolia ETH for gas.
                                        </p>
                                    </div>

                                    {/* Rules & Faucet Info */}
                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Game Rules</h4>
                                            <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4">
                                                <li>Rate: 1 USDC = 1000 Credits.</li>
                                                <li>Countdown shows seconds only in final hours.</li>
                                                <li>Winner settles on-chain to claim NFT + Identity.</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Need Funds?</h4>
                                            <a
                                                href="https://faucet.circle.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs text-center hover:bg-blue-500/20 transition-colors"
                                            >
                                                Get Testnet USDC (Circle Faucet) →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </ClientOnly>
                        </div>


                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

