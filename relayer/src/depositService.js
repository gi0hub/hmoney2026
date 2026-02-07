import { ethers } from 'ethers';
import { NitroliteClient } from '@erc7824/nitrolite';
import WebSocket from 'ws';
import { HYPERDROP_ABI } from './hyperDropAbi.js';

/**
 * Service to deposit credits on Sepolia via Yellow Nitrolite
 */
export class DepositService {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.SEPOLIA_RPC_URL);
        this.wallet = new ethers.Wallet(config.RELAYER_PRIVATE_KEY, this.provider);
        this.nitroliteClient = null;

        console.log(`[KEY] Relayer wallet: ${this.wallet.address}`);
    }

    /**
     * Initialize Nitrolite SDK
     */
    async initialize() {
        try {
            console.log('[LOADING] Initializing Nitrolite SDK...');

            // Fetch config from ClearNode
            const ws = new WebSocket(this.config.CLEARNODE_URL);

            await new Promise((resolve, reject) => {
                ws.on('open', () => {
                    console.log('[NETWORK] Connected to ClearNode');
                    resolve();
                });
                ws.on('error', reject);
            });

            const sepoliaConfig = {
                custody: this.config.CUSTODY_CONTRACT,
                adjudicator: this.config.ADJUDICATOR_CONTRACT,
                guestAddress: this.config.GUEST_ADDRESS,
                tokenAddress: this.config.USDC_TOKEN_ADDRESS,
            };

            console.log('[CONFIG] Sepolia Config:', sepoliaConfig);

            // Initialize Nitrolite
            this.nitroliteClient = new NitroliteClient({
                chainId: 11155111, // Sepolia
                contracts: sepoliaConfig,
                // Nitrolite uses viem interface: needs .account property
                walletClient: { ...this.wallet, account: this.wallet },
                publicClient: this.provider,
                // Add required params if any missing from previous initialize call
                addresses: sepoliaConfig, // Mapping config structure
                challengeDuration: 3600n // Default challenge duration
            });

            console.log('[OK] Nitrolite SDK initialized');
            ws.close();
        } catch (error) {
            console.error('[ERROR] Failed to initialize Nitrolite:', error);
            throw error;
        }
    }

    /**
     * Deposit USDC for a user
     */
    async depositForUser(userAddress, amount) {
        try {
            if (!this.nitroliteClient) {
                await this.initialize();
            }

            console.log(`[BALANCE] Depositing ${amount} USDC for ${userAddress}...`);

            // Convert amount to USDC decimals (6 decimals)
            const amountInWei = ethers.parseUnits(amount.toString(), 6);

            // Deposit via Nitrolite
            const tx = await this.nitroliteClient.deposit(
                this.config.USDC_TOKEN_ADDRESS,
                amountInWei
            );

            console.log(`[OK] Deposit TX: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait();

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                credits: amount
            };
        } catch (error) {
            console.error('[ERROR] Deposit failed:', error);
            throw error;
        }
    }

    /**
     * Check relayer balance
     */
    async checkBalance() {
        try {
            const ethBalance = await this.provider.getBalance(this.wallet.address);

            // USDC contract
            const usdcContract = new ethers.Contract(
                this.config.USDC_TOKEN_ADDRESS,
                ['function balanceOf(address) view returns (uint256)'],
                this.provider
            );

            const usdcBalance = await usdcContract.balanceOf(this.wallet.address);

            return {
                eth: ethers.formatEther(ethBalance),
                usdc: ethers.formatUnits(usdcBalance, 6)
            };
        } catch (error) {
            console.error('Failed to check balance:', error);
            return { eth: '0', usdc: '0' };
        }
    }

    async setWinnerOnChain(assetId, winnerAddress) {
        try {
            const contract = new ethers.Contract(
                this.config.HYPERDROP_CONTRACT,
                HYPERDROP_ABI,
                this.wallet
            );

            const auction = await contract.auctions(assetId);

            // auction struct: [winner, startTime, endTime, settled]
            // Check startTime (index 1) to see if initialized
            if (auction[1] === 0n) {
                console.log(`[INFO] Auction ${assetId} not initialized. Starting now...`);
                // Use backend timestamp
                const now = Math.floor(Date.now() / 1000);
                const duration = 11 * 24 * 60 * 60; // 11 Days

                const start = now;
                const end = now + duration;

                const initTx = await contract.initAuction(assetId, start, end);
                console.log(`[PENDING] Init TX sent: ${initTx.hash}`);
                await initTx.wait();
                console.log(`[OK] Auction Initialized`);
            }

            const tx = await contract.setWinner(assetId, winnerAddress);
            await tx.wait();

            return tx;
        } catch (error) {
            console.error('setWinner tx failed:', error.message);
            throw error;
        }
    }
}
