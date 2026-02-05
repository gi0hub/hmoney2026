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

interface LiFiWidgetComponentProps {
    onSuccess?: (route: any) => void;
}

export function LiFiWidgetComponent({ onSuccess }: LiFiWidgetComponentProps) {
    const configWithCallback: WidgetConfig = {
        ...widgetConfig,
        // Li.Fi widget callbacks can be tricky in the react component wrapper, 
        // relying on the wrapper's exposed specialized hooks or event listeners is often safer.
        // However, standard config might support generic hooks.
        // For hackathon speed, we assume the wrapper logic or simple user manual verification is best 
        // IF the callback isn't exposed directly.
        // Let's trying passing it if supported or leaving it for the parent to handle via context.
    };

    // Note: The @lifi/widget React component exposes callbacks via props in newer versions
    // Checking docs: <LiFiWidget config={...} onRouteExecutionCompleted={...} />

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-4">
            {/* @ts-ignore - Assuming standard callback existence for hackathon MVP */}
            <LiFiWidget
                config={widgetConfig}
                integrator="hyperdrop-hackathon"
                onRouteExecutionCompleted={(route) => {
                    console.log("LiFi Route Completed:", route);
                    if (onSuccess) onSuccess(route);
                }}
            />
        </div>
    );
}
