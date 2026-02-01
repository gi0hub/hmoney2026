'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export interface ToastMessage {
    id: string;
    user: string;
    amount: string;
    hash: string;
}

export function ToastProvider({ messages }: { messages: ToastMessage[] }) {
    // Only show the last 3 messages to avoid clutter
    const displayMessages = messages.slice(-3);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {displayMessages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm backdrop-blur-md shadow-lg"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                        <span className="font-bold text-white">{msg.user}</span>
                        <span className="text-zinc-400">bid</span>
                        <span className="font-bold text-[var(--primary)]">{msg.amount}</span>

                        <a href={`https://sepolia.etherscan.io/tx/${msg.hash}`} target="_blank" rel="noreferrer" className="ml-2 text-zinc-500 hover:text-white">
                            <ExternalLink size={12} />
                        </a>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
