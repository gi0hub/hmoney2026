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
    const [isProcessingBridge, setIsProcessingBridge] = useState(false);

    const handleBridgeSuccess = async (route: any) => {
        try {
            setIsProcessingBridge(true);

            console.log('LiFi Route:', route);

            // Transaction Hash Extraction Strategy
            let txHash = undefined;
            const targetChainId = 8453; // Base

            // 1. Scan process list for destination hash
            if (route.steps) {
                for (const step of route.steps) {
                    if (step.execution?.process) {
                        for (const proc of step.execution.process) {
                            if (proc.txLink && proc.txHash) {
                                txHash = proc.txHash;
                            }
                        }
                    }
                }
            }

            // 2. Fallbacks
            if (!txHash) {
                txHash = route.toChainId === targetChainId ? route.transactionHash : route.steps?.[route.steps.length - 1]?.execution?.toTxHash;
            }

            if (!txHash && route.steps) {
                const lastStep = route.steps[route.steps.length - 1];
                if (lastStep.execution) {
                    txHash = (lastStep.execution as any).toTxHash || (lastStep.execution as any).gasToken?.address;
                }
            }

            // 3. Last resort scan
            if (!txHash && route.steps) {
                for (const step of route.steps) {
                    if (step.execution?.process) {
                        const processes = step.execution.process;
                        if (processes.length > 0) {
                            const lastProc = processes[processes.length - 1];
                            if (lastProc.txHash) txHash = lastProc.txHash;
                        }
                    }
                }
            }

            if (!txHash) txHash = route.transactionHash; // Give up and use main one

            console.log('Extracted Hash:', txHash);
            const amount = route.toAmountUSD || route.toAmount;
            const chainId = route.toChainId || 8453;

            if (!txHash) {
                alert('no tx hash found');
                return;
            }

            console.log('calling relayer...', txHash);

            const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL || 'http://localhost:3001';
            const response = await fetch(`${relayerUrl}/api/bridge-to-testnet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash,
                    userAddress: window.ethereum?.selectedAddress,
                    amount: amount,
                    chainId: chainId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Relayer error: ${data.error || 'Unknown error'}`);
                return;
            }

            console.log('relayer success:', data);
            alert(`Credits deposited! TX: ${data.txHash?.slice(0, 10)}...`);

        } catch (error: any) {
            console.error('bridge failed:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsProcessingBridge(false);
        }
    };

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
                                    <div className="rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-4 mb-4">
                                        <p className="text-xs text-[var(--primary)] font-bold uppercase mb-2">Hybrid Architecture</p>
                                        <p className="text-sm text-zinc-300">
                                            1. You pay with <strong>Real Assets</strong> on Base (via Li.Fi).<br />
                                            2. Our <strong>Oracle</strong> detects the Tx.<br />
                                            3. You receive <strong>Gasless Credits</strong> on Sepolia.
                                        </p>
                                    </div>
                                    <LiFiWidgetComponent onSuccess={handleBridgeSuccess} />
                                </div>
                            </ClientOnly>
                        </div>

                        {/* Footer Action (Manual Override) */}
                        {onOpenChannel && (
                            <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md shrink-0 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Manual Verification</label>
                                        <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Dev Mode</span>
                                    </div>

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
                                        if (onOpenChannel) onOpenChannel(amount);
                                    }}
                                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white font-bold py-3 hover:bg-white/10 transition-all text-sm"
                                >
                                    Force Claim (Skip Bridge)
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

