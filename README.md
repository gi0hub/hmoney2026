# HyperDrop

**Directly Linking Auction Outcomes to On-Chain Identity.**

HyperDrop is a high-speed, auction protocol designed to cryptographically bind auction victories to a verifiable digital identity.

## The Vision

Traditional blockchain auctions suffer from friction: gas fees for every bid, slow block times, and disconnected physical redemption processes. 

**HyperDrop fixes this.**
- **Instant Bidding:** Leverages Nitrolite P2P state channels for sub-second, gasless bids.
- **Identity First:** Every winner automatically receives an ENS subname (e.g., `65.hyperdrop.eth`) alongside their NFT.
- **Atomic Settlement:** Winning an auction triggers a single transaction that mints the Digital Twin (ERC-1155) and assigns the on-chain identity.

## Tech Stack

- **Frontend:** Next.js 15, TailwindCSS, Framer Motion (Cyberpunk/Glassmorphism UI).
- **Clearing Network:** Yellow Network Nitrolite SDK (P2P State Channels).
- **Identity:** ENS NameWrapper (Subname issuance).
- **Smart Contracts:** Solidity (Foundry), deployed on **Sepolia**.
- **Infrastructure:** Vercel (Serverless API Routes for Relayer).

## Architecture

1. **Deposit:** User locks USDC (Sepolia) in the Nitrolite Custody contract -> receives 1000 Credits per 1 USDC.
2. **Bid:** User signs an EIP-712 message (off-chain). Relayer verifies and tracks the state.
3. **Sync:** Relayer periodically updating the high bidder on the `HyperDropProtocol` smart contract.
4. **Settle:** Winner calls `settle()` -> Contract verifies the win -> Mints NFT -> Assigns ENS Subname -> Funds released.

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- An Ethereum Wallet (Metamask, Rainbow, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/gi0hub/hmoney2026.git](https://github.com/gi0hub/hmoney2026.git)
   cd hmoney2026
   ```

2. **Install Web Dependencies:**
   ```bash
   cd web
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the `web` directory:
   ```env
   # Mandatory for App Functionality
   HYPERDROP_CONTRACT=0x1f159842b08Dac10340D358eF3c2B7e15434d9A0
   USDC_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
   
   # Required for Backend (Relayer)
   SEPOLIA_RPC_URL=[https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY](https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)
   RELAYER_PRIVATE_KEY=your_private_key_here
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Smart Contracts (Sepolia)

| Contract | Address |
| :--- | :--- |
| **HyperDrop Protocol** | [`0x1f159842b08Dac10340D358eF3c2B7e15434d9A0`](https://sepolia.etherscan.io/address/0x1f159842b08Dac10340D358eF3c2B7e15434d9A0) |
| **USDC (Test)** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

## Security & Testing

- **Audited Libraries:** Uses OpenZeppelin for ERC-1155 and Ownable standards.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
