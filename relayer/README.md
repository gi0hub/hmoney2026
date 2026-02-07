# HyperDrop Relayer

Backend service that bridges mainnet payments (Li.Fi) to Sepolia testnet credits via Yellow Nitrolite.

## Architecture

```
User → Li.Fi (Mainnet) → Relayer API → Yellow (Sepolia) → User Credits
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

# Mainnet (for verification)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Yellow
CLEARNODE_URL=wss://clearnet-sandbox.yellow.com/ws

# API
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 3. Fund Relayer Wallet

The relayer needs USDC testnet on Sepolia:

#### Get Sepolia USDC (for deposits)
USDC Contract: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

Options:
2. **Send to your relayer wallet**:
   - ~50-100 USDC testnet should be enough for demos

3. **Get Sepolia ETH** (for gas):
   - https://sepoliafaucet.com
   - ~0.1 ETH is enough

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

Response:
```json
{
  "status": "healthy",
  "relayer": "0x...",
  "balance": {
    "eth": "0.1",
    "usdc": "50.0"
  }
}
```

### Bridge Mainnet → Testnet
```bash
POST /api/bridge-to-testnet
Content-Type: application/json

{
  "txHash": "0x...",
  "userAddress": "0x...",
  "amount": "10.5",
  "chainId": 8453
}
```

Success Response:
```json
{
  "success": true,
  "message": "Credits deposited successfully",
  "sepoliaHash": "0x...",
  "credits": "10.5",
  "mainnetTx": {
    "hash": "0x...",
    "from": "0x...",
    "confirmations": 5
  }
}
```

Error Response:
```json
{
  "success": false,
  "error": "Transaction already processed",
  "code": "TX_ALREADY_PROCESSED"
}
```

## Testing

1. **Check health**:
```bash
curl http://localhost:3001/health
```

2. **Test bridge** (replace with real TX):
```bash
curl -X POST http://localhost:3001/api/bridge-to-testnet \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x123...",
    "userAddress": "0x456...",
    "amount": "1.0",
    "chainId": 8453
  }'
```

## Security

- [OK] Rate limiting (10 requests/min per IP)
- [OK] On-chain TX verification
- [OK] Duplicate detection
- [OK] Input validation
- [OK] CORS protection

## Troubleshooting

### "Insufficient USDC balance"
- Fund relayer wallet with testnet USDC
- Check balance: GET /health

### "Transaction not found"
- Wait for mainnet confirmations
- Check TX hash is correct
- Verify chain ID matches

### "SDK not initialized"
- Check ClearNode URL is correct
- Ensure Sepolia RPC is accessible
- Verify contract addresses

## Production Considerations

For production deployment:

1. **Use database** for processed TXs (not in-memory)
2. **Add monitoring** (Sentry, Datadog)
3. **Increase confirmations** (1 → 5+)
4. **Add webhook notifications**
5. **Implement wallet rotation**
6. **Add admin endpoints** (pause, resume)
7. **Use environment-specific configs**

