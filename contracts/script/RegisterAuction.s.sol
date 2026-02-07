// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HyperDropProtocol.sol";

contract RegisterAuction is Script {
    function run() external {
        // 1. Get Environment Variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        uint256 assetId = vm.envUint("ASSET_ID");
        address winnerAddress = vm.envAddress("WINNER_ADDRESS");

        // Calculate start and end times
        uint256 start = block.timestamp;
        uint256 end = start + 11 days; // 11 days from now

        console.log("Initializing Auction:");
        console.log("  Asset ID:", assetId);
        console.log("  Start Time:", start);
        console.log("  End Time:", end);

        vm.startBroadcast(deployerPrivateKey);

        // 2. Load Contract
        HyperDropProtocol hyperDrop = HyperDropProtocol(contractAddress);

        // 3. Initialize Auction
        hyperDrop.initAuction(assetId, start, end);

        if (winnerAddress != address(0)) {
            hyperDrop.setWinner(assetId, winnerAddress);
            console.log("  Initial Winner:", winnerAddress);
        }

        vm.stopBroadcast();

        console.log("Auction initialized successfully!");
    }
}
