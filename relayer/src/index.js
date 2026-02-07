import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { TransactionVerifier } from './txVerifier.js';
import { DepositService } from './depositService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
    message: 'too many requests'
});

const config = {
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL,
    CLEARNODE_URL: process.env.CLEARNODE_URL,
    CUSTODY_CONTRACT: process.env.CUSTODY_CONTRACT,
    ADJUDICATOR_CONTRACT: process.env.ADJUDICATOR_CONTRACT,
    GUEST_ADDRESS: process.env.GUEST_ADDRESS,
    USDC_TOKEN_ADDRESS: process.env.USDC_TOKEN_ADDRESS,
    HYPERDROP_CONTRACT: process.env.HYPERDROP_CONTRACT,
};

const txVerifier = new TransactionVerifier(config);
const depositService = new DepositService(config);

app.get('/health', async (req, res) => {
    try {
        const balance = await depositService.checkBalance();
        res.json({
            status: 'healthy',
            relayer: depositService.wallet.address,
            balance: balance
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

app.post('/api/bridge-to-testnet', limiter, async (req, res) => {
    const { txHash, userAddress, amount, chainId } = req.body;

    if (!txHash || !userAddress || !amount) {
        return res.status(400).json({
            success: false,
            error: 'missing params'
        });
    }

    console.log(`requesting bridge: ${txHash}`);

    try {
        let txInfo;
        try {
            txInfo = await txVerifier.verifyTransaction(
                txHash,
                chainId || 8453,
                amount
            );
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        let depositResult;
        try {
            depositResult = await depositService.depositForUser(
                userAddress,
                amount
            );
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'deposit failed: ' + error.message
            });
        }

        console.log(`bridge done: ${depositResult.hash}`);

        res.json({
            success: true,
            message: 'credits deposited',
            sepoliaHash: depositResult.hash,
            credits: amount,
            mainnetTx: {
                hash: txHash,
                from: txInfo.from,
                confirmations: txInfo.confirmations
            }
        });

    } catch (error) {
        console.error('bridge error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/bid', limiter, async (req, res) => {
    const { itemId, bidder, amount, signature } = req.body;

    if (!itemId || !bidder || !amount || !signature) {
        return res.status(400).json({ error: 'missing fields' });
    }

    console.log(`bid received: item=${itemId} bidder=${bidder} amount=${amount}`);

    try {
        const tx = await depositService.setWinnerOnChain(itemId, bidder);
        console.log(`winner set: ${tx.hash}`);

        res.json({
            success: true,
            txHash: tx.hash
        });
    } catch (error) {
        console.error('setWinner failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`relayer running on ${PORT}`);
    console.log(`cors: ${process.env.CORS_ORIGIN}`);

    depositService.checkBalance().then(balance => {
        console.log(`eth: ${balance.eth}`);
        console.log(`usdc: ${balance.usdc}`);

        if (parseFloat(balance.usdc) < 10) {
            console.warn(`low usdc balance! fund: ${depositService.wallet.address}`);
        }
    });
});
