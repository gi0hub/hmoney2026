// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HyperDropProtocol.sol";

contract InitAllAuctions is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        vm.startBroadcast(deployerKey);

        HyperDropProtocol hyperdrop = HyperDropProtocol(contractAddress);

        uint256 start = block.timestamp;
        uint256 end = start + 11 days; // Auctions open for 11 days

        // Init IDs 1 to 100
        for (uint256 i = 1; i <= 100; i++) {
            // Check if already initialized to avoid reverts
            if (hyperdrop.auctionStartTimes(i) == 0) {
                hyperdrop.initAuction(i, start, end);
                console.log("Initialized auction:", i);
            } else {
                console.log("Already initialized:", i);
            }
        }

        vm.stopBroadcast();
    }
}
