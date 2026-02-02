'use client';

import { LiFiWidget, WidgetConfig } from '@lifi/widget';

const widgetConfig: WidgetConfig = {
    integrator: 'hyperdrop-hackathon',
    theme: {
        container: {
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
        },
    },
    appearance: 'dark',
    subvariant: 'default',
    disabledUI: ['toAddress'],
    toChain: 8453, // Base Mainnet
    toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
};

export function LiFiWidgetComponent() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-4">
            <LiFiWidget config={widgetConfig} integrator="hyperdrop-hackathon" />
        </div>
    );
}
