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
    bytes32 public immutable ROOT_NODE;
    INameWrapper public immutable NAME_WRAPPER;

    struct Auction {
        address winner;
        uint64 startTime;
        uint64 endTime;
        bool settled;
    }

    mapping(uint256 => Auction) public auctions;

    event AuctionInitialized(
        uint256 indexed assetId,
        uint256 startTime,
        uint256 endTime
    );
    event WinnerUpdated(
        uint256 indexed assetId,
        address indexed winner,
        uint256 timestamp
    );
    event AuctionSettled(
        uint256 indexed assetId,
        address indexed winner,
        string subnameLabel
    );

    constructor(
        string memory uri_,
        address initialOwner,
        bytes32 _rootNode,
        address _nameWrapper
    ) ERC1155(uri_) Ownable(initialOwner) {
        ROOT_NODE = _rootNode;
        NAME_WRAPPER = INameWrapper(_nameWrapper);
    }

    function initAuction(uint256 assetId, uint256 start, uint256 end) external {
        require(start < end, "bad times");
        require(auctions[assetId].startTime == 0, "exists");

        auctions[assetId] = Auction({
            winner: address(0),
            startTime: uint64(start),
            endTime: uint64(end),
            settled: false
        });

        emit AuctionInitialized(assetId, start, end);
    }

    // called by frontend after each bid
    function setWinner(uint256 assetId, address winner) external {
        Auction storage auction = auctions[assetId];

        require(auction.startTime != 0, "not init");
        require(block.timestamp >= auction.startTime, "too early");
        require(block.timestamp < auction.endTime, "ended");
        require(!auction.settled, "done");
        require(winner != address(0), "zero addr");

        auction.winner = winner;
        emit WinnerUpdated(assetId, winner, block.timestamp);
    }

    function forceEndAuction(uint256 assetId) external {
        Auction storage auction = auctions[assetId];
        require(auction.startTime != 0, "not init");
        require(!auction.settled, "already settled");

        auction.endTime = uint64(block.timestamp - 1);
    }

    function settle(uint256 assetId, string calldata label) external {
        Auction storage auction = auctions[assetId];

        require(auction.winner != address(0), "no winner");
        require(msg.sender == auction.winner, "not winner");
        require(block.timestamp >= auction.endTime, "still running");
        require(!auction.settled, "done");

        auction.settled = true;

        _mint(auction.winner, assetId, 1, "");

        NAME_WRAPPER.setSubnodeRecord(
            ROOT_NODE,
            label,
            auction.winner,
            address(0),
            0,
            0,
            0
        );

        emit AuctionSettled(assetId, auction.winner, label);
    }

    function auctionWinners(uint256 assetId) external view returns (address) {
        return auctions[assetId].winner;
    }

    function auctionEndTimes(uint256 assetId) external view returns (uint256) {
        return auctions[assetId].endTime;
    }

    function auctionSettled(uint256 assetId) external view returns (bool) {
        return auctions[assetId].settled;
    }

    function auctionStartTimes(
        uint256 assetId
    ) external view returns (uint256) {
        return auctions[assetId].startTime;
    }
}
