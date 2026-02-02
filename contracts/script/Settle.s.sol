// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HyperDropProtocol.sol";

contract Settle is Script {
    function run() external {
        // 1. Get Environment Variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        // Settlement Details
        address winnerAddress = vm.envAddress("WINNER_ADDRESS");
        uint256 assetId = vm.envUint("ASSET_ID");
        string memory subnameLabel = vm.envString("SUBNAME_LABEL");

        vm.startBroadcast(deployerPrivateKey);

        // 2. Load Contract
        HyperDropProtocol hyperDrop = HyperDropProtocol(contractAddress);

        // 3. Settle Auction (Mint NFT + Issue ENS Subname)
        hyperDrop.settleAuction(winnerAddress, assetId, subnameLabel);

        vm.stopBroadcast();
    }
}
