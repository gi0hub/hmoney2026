// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INameWrapper {
    function setSubnodeRecord(
        bytes32 node,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32);
}

contract HyperDropProtocol is ERC1155, Ownable {
    // The namehash of the protocol's domain (e.g., hyperdrop.eth)
    bytes32 public immutable ROOT_NODE;
    // The ENS NameWrapper contract
    INameWrapper public immutable NAME_WRAPPER;

    constructor(
        string memory uri_,
        address initialOwner,
        bytes32 _rootNode,
        address _nameWrapper
    ) ERC1155(uri_) Ownable(initialOwner) {
        ROOT_NODE = _rootNode;
        NAME_WRAPPER = INameWrapper(_nameWrapper);
    }

    /**
     * @notice Settles an auction by minting the asset and assigning a subname.
     * @dev Only callable by the auction operator (Yellow Network node).
     * @param winner The address of the auction winner.
     * @param assetId The ID of the asset to mint.
     * @param subnameLabel The label for the subname (e.g., "100" for 100.hyperdrop.eth).
     */
    function settleAuction(
        address winner,
        uint256 assetId,
        string calldata subnameLabel
    ) external onlyOwner {
        // 1. Mint the Item (ERC1155)
        _mint(winner, assetId, 1, "");

        // 2. Issue a Subname
        // Note: The protocol contract must be the owner of 'ROOT_NODE' in the NameWrapper
        // for this to succeed (or have setSubnodeOwner permissions).
        NAME_WRAPPER.setSubnodeRecord(
            ROOT_NODE,
            subnameLabel,
            winner,
            address(0), // No specific resolver script for MVP, using default or parent's if applicable
            0, // Default TTL
            0, // 0 fuses = Burnable, can transfer, etc.
            0 // Default expiry (respects parent expiry)
        );
    }
}
