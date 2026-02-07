// Internal error message registry

export const ErrorMessages = {
    // Wallet Errors
    WALLET_NOT_CONNECTED: {
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to continue.',
    },
    WALLET_WRONG_NETWORK: {
        title: 'Wrong Network',
        message: 'Please switch to Sepolia testnet to continue.',
    },
    WALLET_REJECTED: {
        title: 'Transaction Rejected',
        message: 'You cancelled the transaction in your wallet.',
    },

    // Yellow/Channel Errors
    INSUFFICIENT_CREDITS: {
        title: 'Insufficient Credits',
        message: 'You don\'t have enough credits. Please top up your balance.',
    },
    CHANNEL_NOT_READY: {
        title: 'Channel Not Ready',
        message: 'Please wait for your payment channel to initialize.',
    },
    SDK_NOT_INITIALIZED: {
        title: 'Connection Error',
        message: 'Nitrolite SDK not ready. Please refresh the page.',
    },
    DEPOSIT_FAILED: {
        title: 'Deposit Failed',
        message: 'Failed to deposit funds. Please check your balance and try again.',
    },

    // Settlement Errors
    AUCTION_NOT_REGISTERED: {
        title: 'Auction Not Registered',
        message: 'This auction hasn\'t been finalized yet. Please wait for the owner.',
    },
    NOT_WINNER: {
        title: 'Not Authorized',
        message: 'Only the auction winner can claim this item.',
    },
    AUCTION_NOT_ENDED: {
        title: 'Auction Still Active',
        message: 'You can only claim after the auction ends.',
    },
    ALREADY_SETTLED: {
        title: 'Already Claimed',
        message: 'This auction has already been settled.',
    },
    SETTLEMENT_FAILED: {
        title: 'Settlement Failed',
        message: 'Failed to settle auction. Please try again.',
    },

    // Bidding Errors
    BID_TOO_LOW: {
        title: 'Bid Too Low',
        message: 'Your bid must be higher than the current highest bid.',
    },
    AUCTION_ENDED: {
        title: 'Auction Ended',
        message: 'This auction has already closed.',
    },
    SIGNING_FAILED: {
        title: 'Signature Failed',
        message: 'Failed to sign your bid. Please try again.',
    },

    // Network Errors
    NETWORK_ERROR: {
        title: 'Network Error',
        message: 'Failed to connect. Please check your internet connection.',
    },
    RPC_ERROR: {
        title: 'RPC Error',
        message: 'Failed to communicate with blockchain. Please try again.',
    },

    // Generic
    UNKNOWN_ERROR: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
    },
} as const;

export const SuccessMessages = {
    BID_PLACED: {
        title: 'Bid Placed!',
        message: 'Your bid has been successfully submitted.',
    },
    DEPOSIT_SUCCESS: {
        title: 'Deposit Successful',
        message: 'Funds added to your channel balance.',
    },
    CHANNEL_OPENED: {
        title: 'Channel Opened',
        message: 'Your payment channel is ready to use.',
    },
    SETTLEMENT_SUCCESS: {
        title: 'Settlement Complete!',
        message: 'NFT and ENS subdomain have been transferred to your wallet.',
    },
    WITHDRAWAL_SUCCESS: {
        title: 'Withdrawal Complete',
        message: 'Funds have been transferred to your wallet.',
    },
} as const;

// Map revert reasons to UI errors
export function parseContractError(error: any): { title: string; message: string } {
    const errorMessage = error?.message || error?.toString() || '';

    // Match specific contract revert reasons
    if (errorMessage.includes('Auction not registered')) {
        return ErrorMessages.AUCTION_NOT_REGISTERED;
    }
    if (errorMessage.includes('Only winner can settle')) {
        return ErrorMessages.NOT_WINNER;
    }
    if (errorMessage.includes('Auction not ended')) {
        return ErrorMessages.AUCTION_NOT_ENDED;
    }
    if (errorMessage.includes('Already settled')) {
        return ErrorMessages.ALREADY_SETTLED;
    }

    // User rejected transaction
    if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        return ErrorMessages.WALLET_REJECTED;
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        return ErrorMessages.NETWORK_ERROR;
    }

    // Default
    return ErrorMessages.UNKNOWN_ERROR;
}

// Map SDK errors to UI errors
export function parseYellowError(error: any): { title: string; message: string } {
    const errorMessage = error?.message || error?.toString() || '';

    if (errorMessage.includes('not initialized') || errorMessage.includes('SDK')) {
        return ErrorMessages.SDK_NOT_INITIALIZED;
    }
    if (errorMessage.includes('Insufficient') || errorMessage.includes('credits')) {
        return ErrorMessages.INSUFFICIENT_CREDITS;
    }
    if (errorMessage.includes('deposit')) {
        return ErrorMessages.DEPOSIT_FAILED;
    }
    if (errorMessage.includes('Channel') || errorMessage.includes('channel')) {
        return ErrorMessages.CHANNEL_NOT_READY;
    }

    return ErrorMessages.UNKNOWN_ERROR;
}
