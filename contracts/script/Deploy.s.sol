// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/HyperDropProtocol.sol";

contract Deploy is Script {
    function run() external {
        // These should be set in .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address ownerAddress = vm.envOr("OWNER_ADDRESS", vm.addr(deployerPrivateKey));
        
        // Sepolia Config defaults (ENS NameWrapper on Sepolia)
        // 0x0635513f179D50A207757E05759CbD106d7dFcE8 is the NameWrapper on Sepolia
        address nameWrapper = vm.envOr("NAME_WRAPPER", address(0x0635513f179D50A207757E05759CbD106d7dFcE8));
        bytes32 rootNode = vm.envBytes32("ROOT_NODE"); // e.g. namehash("hyperdrop.eth")

        vm.startBroadcast(deployerPrivateKey);

        new HyperDropProtocol(
            "https://api.hyperdrop.xyz/item/{id}.json",
            ownerAddress,
            rootNode,
            nameWrapper
        );

        vm.stopBroadcast();
    }
}
