'use client';

import { motion } from 'framer-motion';
import { TShirtVisual } from './TShirtVisual';

interface CatalogGridProps {
    onSelectItem: (id: number) => void;
    selectedId: number;
}

// ... imports
import { useState } from 'react';

interface CatalogGridProps {
    onSelectItem: (id: number) => void;
    selectedId: number;
    itemStatuses?: Record<string, 'live' | 'sold'>;
}

export function CatalogGrid({ onSelectItem, selectedId, itemStatuses = {} }: CatalogGridProps) {
    //  items 1-100
    const allItems = Array.from({ length: 100 }, (_, i) => i + 1);

    type FilterType = 'ALL' | 'LIVE' | 'SOLD';
    const [filter, setFilter] = useState<FilterType>('ALL');

    const filteredItems = allItems.filter(id => {
        if (filter === 'ALL') return true;
        const status = itemStatuses[id.toString()] || 'live';
        if (filter === 'LIVE') return status === 'live';
        if (filter === 'SOLD') return status === 'sold';
        return true;
    });

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                    Collection Catalog <span className="text-zinc-500 text-lg font-normal">({filteredItems.length} Items)</span>
                </h3>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded transition-colors
                        ${filter === 'ALL'
                                ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'text-zinc-500 border-white/10 hover:text-white'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('LIVE')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded transition-colors
                        ${filter === 'LIVE'
                                ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'text-zinc-500 border-white/10 hover:text-white'}`}
                    >
                        Live
                    </button>
                    <button
                        onClick={() => setFilter('SOLD')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded transition-colors
                        ${filter === 'SOLD'
                                ? 'text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'text-zinc-500 border-white/10 hover:text-white'}`}
                    >
                        Sold
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {filteredItems.map((id) => {
                    const isSelected = selectedId === id;
                    // Check actual passed status
                    const status = itemStatuses[id.toString()] || 'live';
                    const isLive = status === 'live';

                    return (
                        <motion.button
                            key={id}
                            onClick={() => onSelectItem(id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            layout // Animates layout changes during filtering
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
                                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

