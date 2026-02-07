
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

function getRandomDuration() {
    // 7 days to 9 days in seconds
    const min = 7 * 24 * 60 * 60;
    const max = 9 * 24 * 60 * 60;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.HYPERDROP_CONTRACT, ABI, wallet);

    console.log(`Using wallet: ${wallet.address}`);

    const now = Math.floor(Date.now() / 1000);

    // Init remaining IDs up to 100
    for (let i = 1; i <= 100; i++) {
        try {
            const startTime = await contract.auctionStartTimes(i);

            if (startTime.toString() === "0") {
                const randomDuration = getRandomDuration();
                const end = now + randomDuration;

                // Log duration in days for verification
                const days = (randomDuration / (24 * 60 * 60)).toFixed(2);

                console.log(`Initializing Auction #${i} with ${days} days duration...`);
                const tx = await contract.initAuction(i, now, end);
                console.log(`  Tx sent: ${tx.hash}`);
                await tx.wait();
                console.log(`  Confirmed #${i}`);
                await sleep(1000);
            } else {
                // console.log(`Auction #${i} already initialized.`);
            }
        } catch (e) {
            console.error(`Error on #${i}:`, e.message);
            await sleep(2000);
        }
    }
}

main();
