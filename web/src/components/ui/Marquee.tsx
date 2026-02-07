'use client';

interface Winner {
    id: string;
    ens: string;
    price: string;
    txHash: string;
}

export function Marquee({ winners }: { winners: Winner[] }) {
    if (winners.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-t border-white/10 overflow-hidden py-2">
            <div className="animate-marquee flex">
                {/* Static loop set */}
                <div className="flex gap-8 items-center px-4">
                    {winners.map((w, i) => (
                        <div key={`set1-${w.id}-${i}`} className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <span className="text-[var(--primary)] font-bold">★ {w.ens}</span>
                            <span className="text-zinc-500">bet</span>
                            <span className="text-white font-bold">{w.price}</span>
                            <span className="text-zinc-500">on #{w.id}</span>
                        </div>
                    ))}
                </div>
                {/* Dupe for loop */}
                <div className="flex gap-8 items-center px-4">
                    {winners.map((w, i) => (
                        <div key={`set2-${w.id}-${i}`} className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <span className="text-[var(--primary)] font-bold">★ {w.ens}</span>
                            <span className="text-zinc-500">bet</span>
                            <span className="text-white font-bold">{w.price}</span>
                            <span className="text-zinc-500">on #{w.id}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
