
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ABI = [
    "function auctionStartTimes(uint256) view returns (uint256)",
    "function initAuction(uint256 assetId, uint256 start, uint256 end) external"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.HYPERDROP_CONTRACT, ABI, wallet);

    console.log(`Using wallet: ${wallet.address}`);

    const now = Math.floor(Date.now() / 1000);
    const end = now + (11 * 24 * 60 * 60);

    // Init IDs 50 to 100
    for (let i = 50; i <= 100; i++) {
        try {
            const startTime = await contract.auctionStartTimes(i);

            if (startTime.toString() === "0") {
                console.log(`Initializing Auction #${i}...`);
                const tx = await contract.initAuction(i, now, end);
                console.log(`  Tx sent: ${tx.hash}`);
                await tx.wait();
                console.log(`  Confirmed #${i}`);
                await sleep(1000); // Slightly faster
            } else {
                console.log(`Auction #${i} already initialized.`);
            }
        } catch (e) {
            console.error(`Error on #${i}:`, e.message);
            await sleep(2000);
        }
    }
}

main();
