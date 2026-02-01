export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-24 bg-[var(--background)] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--primary)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b border-white/10 bg-black/50 backdrop-blur-md pb-6 pt-8 lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200/0 lg:p-4">
          <code className="font-mono font-bold text-2xl tracking-tighter">
            HYPER<span className="text-[var(--primary)]">DROP</span>
          </code>
        </div>

        {/* Connection Placeholder */}
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <button className="px-6 py-2 rounded-full border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black transition-all">
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-32 text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            NEXT-GEN
          </span>
          <br />
          <span className="text-[var(--primary)] animate-pulse-glow">
            AUCTIONS
          </span>
        </h1>

        <p className="mt-4 text-xl text-gray-400 max-w-2xl">
          Exclusive serigraphed merch backed by ENS & NFTs.
          <br />
          Bid with <span className="text-yellow-400">Yellow High-Speed</span> markets.
          <br />
          Bridge instantly with <span className="text-blue-400">Li.Fi</span>.
        </p>

        {/* Action Widgets Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20 w-full max-w-4xl">
          {/* Top Up Card */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center min-h-[300px] border border-white/5 hover:border-[var(--primary)]/50 transition-all cursor-pointer group">
            <h3 className="text-2xl font-bold mb-4 group-hover:text-[var(--primary)] transition-colors">Top Up Credits</h3>
            <p className="text-gray-500 mb-6">Bridge USDC/ETH to Base</p>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-3xl">💎</span>
            </div>
          </div>

          {/* Auction Card */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center min-h-[300px] border border-white/5 hover:border-yellow-400/50 transition-all cursor-pointer group">
            <h3 className="text-2xl font-bold mb-4 group-hover:text-yellow-400 transition-colors">Live Auctions</h3>
            <p className="text-gray-500 mb-6">Bid on exclusive items</p>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚡</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
