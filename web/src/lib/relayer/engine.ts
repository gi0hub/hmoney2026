import { ethers } from 'ethers';
import { HYPERDROP_ABI } from './hyperDropAbi';

export class RelayerEngine {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;


    constructor() {
        if (!process.env.RELAYER_PRIVATE_KEY) throw new Error('RELAYER_PRIVATE_KEY missing');
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, this.provider);
    }


    // Register winner on-chain
    async setWinnerOnChain(assetId: number, winnerAddress: string) {
        const contract = new ethers.Contract(
            process.env.HYPERDROP_CONTRACT!,
            HYPERDROP_ABI,
            this.wallet
        );

        // check if initialized
        const auction = await contract.auctions(assetId);
        if (auction.startTime === 0n) {
            console.log(`[Engine] Initializing Auction ${assetId}...`);
            const now = Math.floor(Date.now() / 1000);
            const duration = 11 * 24 * 60 * 60;
            try {
                const initTx = await contract.initAuction(assetId, now, now + duration);
                await initTx.wait();
            } catch (e: any) {
                if (e.message.includes('exists')) {
                    console.log(`[Engine] Auction ${assetId} already initialized by another request.`);
                } else {
                    throw e;
                }
            }
        }

        console.log(`[Engine] Sending setWinner for ${assetId} to ${winnerAddress}`);
        const tx = await contract.setWinner(assetId, winnerAddress);

        return tx.hash;
    }


    async getBalances() {
        const ethBalance = await this.provider.getBalance(this.wallet.address);
        const usdcContract = new ethers.Contract(
            process.env.USDC_TOKEN_ADDRESS!,
            ['function balanceOf(address) view returns (uint256)'],
            this.provider
        );
        const usdcBalance = await usdcContract.balanceOf(this.wallet.address);

        return {
            eth: ethers.formatEther(ethBalance),
            usdc: ethers.formatUnits(usdcBalance, 6)
        };
    }
}
