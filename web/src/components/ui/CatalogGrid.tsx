'use client';

import { motion } from 'framer-motion';
import { TShirtVisual } from './TShirtVisual';

interface CatalogGridProps {
    onSelectItem: (id: number) => void;
    selectedId: number;
}

export function CatalogGrid({ onSelectItem, selectedId }: CatalogGridProps) {
    //  items 1-100
    const items = Array.from({ length: 100 }, (_, i) => i + 1);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                    Collection Catalog <span className="text-zinc-500 text-lg font-normal">({items.length} Items)</span>
                </h3>

                {/* Filters / Sort (Visual only for now) */}
                <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)] border border-[var(--primary)] rounded bg-[var(--primary)]/10">
                        All
                    </button>
                    <button className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500 border border-white/10 rounded hover:text-white transition-colors">
                        Live
                    </button>
                    <button className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500 border border-white/10 rounded hover:text-white transition-colors">
                        Sold
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {items.map((id) => {
                    const isSelected = selectedId === id;
                    const isLive = id === selectedId; // Mock logic: selected is "live"

                    return (
                        <motion.button
                            key={id}
                            onClick={() => onSelectItem(id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative aspect-square rounded-xl border p-2 flex flex-col items-center justify-between transition-all group
                 ${isSelected
                                    ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]'
                                    : 'bg-black/30 border-white/5 hover:border-white/20'
                                }
               `}
                        >
                            {/* ID Badge */}
                            <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[var(--primary)]' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                #{id.toString().padStart(3, '0')}
                            </span>

                            {/* Image Placeholder */}
                            <div className={`w-full aspect-square rounded-lg flex items-center justify-center p-2 mb-2
                  ${isSelected ? 'bg-[var(--primary)]/5' : 'bg-white/5 group-hover:bg-white/10'}
               `}>
                                <TShirtVisual number={id} primaryColor={isSelected ? "#06b6d4" : "#52525b"} />
                            </div>

                            {/* Status Dot */}
                            <div className="w-full flex justify-end">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
