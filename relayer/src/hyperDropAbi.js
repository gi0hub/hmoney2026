export const HYPERDROP_ABI = [
    {
        name: 'initAuction',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assetId', type: 'uint256' },
            { name: 'start', type: 'uint256' },
            { name: 'end', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'setWinner',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assetId', type: 'uint256' },
            { name: 'winner', type: 'address' }
        ],
        outputs: []
    },
    {
        name: 'settle',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assetId', type: 'uint256' },
            { name: 'label', type: 'string' }
        ],
        outputs: []
    },
    {
        name: 'auctions',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'winner', type: 'address' },
            { name: 'settled', type: 'bool' }
        ]
    }
];
