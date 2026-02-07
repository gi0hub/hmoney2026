// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HyperDropProtocol.sol";

contract Settle is Script {
    function run() external {
        // 1. Get Environment Variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        uint256 assetId = vm.envUint("ASSET_ID");
        string memory label = vm.envString("SUBNAME_LABEL");

        vm.startBroadcast();

        // 2. Load Contract
        HyperDropProtocol hyperDrop = HyperDropProtocol(contractAddress);

        // 3. Settle Auction (as the winner)
        hyperDrop.settle(assetId, label);

        vm.stopBroadcast();

        console.log("settled!");
        console.log("asset:", assetId);
        console.log("label:", label);
    }
}
