# HyperDrop Relayer

Backend service that handles off-chain bidding signatures and on-chain settlement for the HyperDrop auction.

## Architecture

```
User (Web) → Relayer API (/api/bid) → Yellow Nitrolite (Sepolia)
```

## Setup

### 1. Install Dependencies

```bash
cd relayer
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
RELAYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# API
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Yellow
CLEARNODE_URL=wss://clearnet-sandbox.yellow.com/ws
```

### 3. Fund Relayer Wallet

The relayer needs Sepolia ETH to process `setWinner` transactions.
- Get Sepolia ETH: https://sepoliafaucet.com

### 4. Start Server

```bash
npm start
# or for development:
npm run dev
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Place Bid (Off-Chain)
Accepts a signed bid from the user and attempts to settle it on-chain if they win.

```bash
POST /api/bid
Content-Type: application/json

{
  "itemId": 100,
  "bidder": "0xUserAddress",
  "amount": 500,
  "signature": "0xSignature..."
}
```

## Deprecated Features

### Bridge (Mainnet → Testnet)
*The automated Li.Fi bridge has been disabled on the frontend. The `/api/bridge-to-testnet` endpoint remains but is not currently used.*

