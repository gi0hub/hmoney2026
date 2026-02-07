'use client';

import { LiFiWidget, WidgetConfig, widgetEvents, WidgetEvent } from '@lifi/widget';
import { useEffect } from 'react';

const widgetConfig: WidgetConfig = {
    integrator: 'hyperdrop',
    theme: {
        container: {
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
        },
    },
    appearance: 'dark',
    // fromChain removed to avoid forcing conflicts and API spam (429)
    toChain: 8453, // Base Mainnet
    toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    toAddress: {
        address: '0x53A907998138942ba98629084d2cbEe4C32347B6',
        name: 'HyperDrop Gateway',
        chainType: 'EVM' as any, // Fix TS error: Property 'chainType' is missing
    },

    sdkConfig: {
        routeOptions: {
            allowSwitchChain: true,
        },
    },
    // User can pay with ANY token - Li.Fi auto-swaps to USDC and sends to your wallet
    // User can pay with ANY token - Li.Fi auto-swaps to USDC and sends to your wallet
};

interface LiFiWidgetComponentProps {
    onSuccess?: (route: any) => void;
}

export function LiFiWidgetComponent({ onSuccess }: LiFiWidgetComponentProps) {
    useEffect(() => {
        const handleRouteExecutionCompleted = (route: any) => {
            console.log("LiFi Route Completed:", route);
            if (onSuccess) onSuccess(route);
        };

        widgetEvents.on(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted);

        return () => {
            widgetEvents.off(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted);
        };
    }, [onSuccess]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-4">
            <LiFiWidget
                config={widgetConfig}
                integrator="hyperdrop"
            />
        </div>
    );
}
