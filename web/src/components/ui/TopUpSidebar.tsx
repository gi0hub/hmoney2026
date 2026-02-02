'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ClientOnly } from '../ClientOnly';
import { useState } from 'react';

import { LiFiWidgetComponent } from './LiFiWidgetComponent';

interface TopUpSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenChannel?: (amount: string) => void;
}

export function TopUpSidebar({ isOpen, onClose, onOpenChannel }: TopUpSidebarProps) {
    const [amount, setAmount] = useState('0.20'); // Default test amount

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
                                Bridge & <span className="text-[var(--primary)]">Top Up</span>
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area (Widget) */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            <ClientOnly>
                                <div className="mb-6">
                                    <p className="text-sm text-zinc-400 mb-4 px-2">
                                        1. Bridge funds to <strong>Base (USDC)</strong> using the widget below.<br />
                                        2. Enter the bridged amount below to verify.<br />
                                        3. Click "Claim Credits" to switch to <strong>Sepolia</strong>.
                                    </p>
                                    <LiFiWidgetComponent />
                                </div>
                            </ClientOnly>
                        </div>

                        {/* Footer Action */}
                        {onOpenChannel && (
                            <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md shrink-0 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Oracle Verification (Simulated)</label>
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                        <span className="text-zinc-400">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="bg-transparent text-white font-mono w-full focus:outline-none"
                                            placeholder="0.00"
                                        />
                                        <span className="text-zinc-500 text-sm">USDC</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        onOpenChannel(amount);
                                        onClose();
                                    }}
                                    className="w-full rounded-xl bg-[var(--primary)] text-black font-bold py-3 hover:shadow-[0_0_20px_var(--primary-glow)] transition-all"
                                >
                                    Verify & Claim Credits
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

