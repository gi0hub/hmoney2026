import { ethers } from 'ethers';

/**
 * Service to verify mainnet transactions
 */
export class TransactionVerifier {
    constructor(config) {
        this.baseProvider = new ethers.JsonRpcProvider(config.BASE_RPC_URL);
        this.ethereumProvider = new ethers.JsonRpcProvider(config.ETHEREUM_RPC_URL);
        this.arbitrumProvider = new ethers.JsonRpcProvider(config.ARBITRUM_RPC_URL);
        this.processedTxs = new Set(); // In-memory cache (use Redis in production)
    }

    /**
     * Verify a transaction on mainnet
     */
    async verifyTransaction(txHash, chainId, expectedAmount) {
        try {
            // Check if already processed
            if (this.processedTxs.has(txHash)) {
                throw new Error('Transaction already processed');
            }

            // Select provider based on chain
            const provider = this.getProvider(chainId);
            if (!provider) {
                throw new Error(`Unsupported chain ID: ${chainId}`);
            }

            // Get transaction with retries (handling RPC indexing latency)
            let tx = null;
            let receipt = null;

            for (let i = 0; i < 5; i++) {
                try {
                    tx = await provider.getTransaction(txHash);
                    if (tx) {
                        receipt = await provider.getTransactionReceipt(txHash);
                        if (receipt) break;
                    }
                } catch (e) { console.log(`retry ${i + 1}...`); }

                await new Promise(r => setTimeout(r, 3000)); // Wait 3s (Total ~15s)
            }

            if (!tx) {
                throw new Error('Transaction not found (after retries)');
            }

            // Wait for confirmations
            if (!receipt) {
                throw new Error('Transaction not confirmed (or not found on RPC yet)');
            }

            if (receipt.status !== 1) {
                throw new Error('Transaction failed');
            }

            // Check confirmations
            const currentBlock = await provider.getBlockNumber();
            const confirmations = currentBlock - receipt.blockNumber;
            if (confirmations < 1) {
                throw new Error('Insufficient confirmations');
            }

            // Verify payment to specific address (USDC on Base)
            const RECIPIENT_ADDRESS = '0x53A907998138942ba98629084d2cbEe4C32347B6';
            const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

            // Parse logs to find USDC Transfer event to recipient
            const transferEvent = receipt.logs.find(log => {
                // Transfer(address indexed from, address indexed to, uint256 value)
                // Topic0: keccak256("Transfer(address,address,uint256)")
                const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

                if (log.topics[0] !== TRANSFER_TOPIC) return false;
                if (log.address.toLowerCase() !== USDC_BASE.toLowerCase()) return false;

                // Topic2 is "to" address (indexed, so it's in topics)
                const toAddress = '0x' + log.topics[2].slice(26); // Remove padding
                return toAddress.toLowerCase() === RECIPIENT_ADDRESS.toLowerCase();
            });

            if (!transferEvent) {
                throw new Error('No USDC transfer to specified recipient found');
            }

            // Extract amount from log data (6 decimals for USDC)
            const amountRaw = BigInt(transferEvent.data);
            const amount = Number(amountRaw) / 1e6; // USDC has 6 decimals

            console.log(`[OK] TX verified: ${txHash} (${confirmations} confirmations, ${amount} USDC)`);

            // Mark as processed
            this.processedTxs.add(txHash);

            return {
                valid: true,
                from: tx.from,
                to: RECIPIENT_ADDRESS,
                amount: amount.toString(),
                blockNumber: receipt.blockNumber,
                confirmations
            };
        } catch (error) {
            console.error('[ERROR] TX verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Get provider for chain ID
     */
    getProvider(chainId) {
        const chains = {
            8453: this.baseProvider,    // Base
            1: this.ethereumProvider,    // Ethereum
        };
        return chains[chainId];
    }

    /**
     * Clear processed transactions (for testing)
     */
    clearCache() {
        this.processedTxs.clear();
    }
}
