'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextValue {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    hideToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto dismiss after duration (default 5s)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        showToast({ type: 'success', title, message });
    }, [showToast]);

    const error = useCallback((title: string, message?: string) => {
        showToast({ type: 'error', title, message, duration: 7000 }); // Errors stay longer
    }, [showToast]);

    const warning = useCallback((title: string, message?: string) => {
        showToast({ type: 'warning', title, message });
    }, [showToast]);

    const info = useCallback((title: string, message?: string) => {
        showToast({ type: 'info', title, message });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, hideToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={hideToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertTriangle,
        info: Info,
    };

    const colors = {
        success: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            icon: 'text-emerald-400',
            text: 'text-emerald-100',
        },
        error: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: 'text-red-400',
            text: 'text-red-100',
        },
        warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            icon: 'text-amber-400',
            text: 'text-amber-100',
        },
        info: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            icon: 'text-blue-400',
            text: 'text-blue-100',
        },
    };

    const Icon = icons[toast.type];
    const colorScheme = colors[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${colorScheme.border} ${colorScheme.bg} backdrop-blur-xl shadow-2xl p-4 min-w-[320px]`}
        >
            <Icon className={`${colorScheme.icon} flex-shrink-0 mt-0.5`} size={20} />

            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${colorScheme.text} text-sm`}>{toast.title}</h4>
                {toast.message && (
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className={`${colorScheme.text} text-xs font-medium mt-2 hover:underline`}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                onClick={() => onDismiss(toast.id)}
                className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
