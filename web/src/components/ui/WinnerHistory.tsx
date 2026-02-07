import { ExternalLink, Trophy } from 'lucide-react';

interface Winner {
    id: string;
    ens: string;
    avatar?: string;
    price: string;
    date: string;
    txHash: string;
}

export function WinnerHistory({ winners }: { winners: Winner[] }) {
    return (
        <div className="w-full rounded-3xl border border-white/10 bg-black/20 backdrop-blur-lg p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-2 mb-6">
                <Trophy size={20} className="text-yellow-500" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Hall of Fame</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-zinc-500">
                            <th className="pb-3 pl-4 font-medium uppercase tracking-wider text-center">Winner</th>
                            <th className="pb-3 font-medium uppercase tracking-wider text-center">Price</th>
                            <th className="pb-3 font-medium uppercase tracking-wider text-center">Date</th>
                            <th className="pb-3 text-right pr-4 font-medium uppercase tracking-wider">Proof</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {winners.map((winner) => (
                            <tr key={winner.id} className="group transition-colors hover:bg-white/5">
                                <td className="py-4 pl-4 font-bold text-[var(--primary)] group-hover:text-[var(--primary-glow)] transition-colors text-center">
                                    {winner.ens}
                                </td>
                                <td className="py-4 text-zinc-300 text-center">
                                    {winner.price}
                                </td>
                                <td className="py-4 text-zinc-500 text-center">
                                    {winner.date}
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${winner.txHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
