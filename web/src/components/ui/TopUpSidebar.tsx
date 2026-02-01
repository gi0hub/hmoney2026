'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ClientOnly } from '../ClientOnly';

interface TopUpSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode; // The LiLink Widget or Placeholder
}

export function TopUpSidebar({ isOpen, onClose, children }: TopUpSidebarProps) {
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
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-black/80 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 p-6">
                            <h2 className="text-xl font-bold tracking-tight text-white">
                                Top Up <span className="text-[var(--primary)]">Credits</span>
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area (Widget) */}
                        <div className="h-[calc(100%-80px)] overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            <ClientOnly>
                                {children}
                            </ClientOnly>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
