'use client';
import { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: t.type === 'success' ? 'rgba(52, 211, 153, 0.15)' :
                         t.type === 'error' ? 'rgba(239, 68, 68, 0.15)' :
                         'rgba(56, 189, 248, 0.15)',
              border: t.type === 'success' ? '1px solid rgba(52, 211, 153, 0.3)' :
                      t.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' :
                      '1px solid rgba(56, 189, 248, 0.3)',
              color: t.type === 'success' ? 'var(--accent-emerald)' :
                     t.type === 'error' ? '#ef4444' :
                     'var(--accent-sky)',
              fontSize: '13px',
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              animation: 'toastSlideIn 0.2s ease-out'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
