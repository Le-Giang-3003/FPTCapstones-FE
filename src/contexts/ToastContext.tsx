import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="ds-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`ds-toast ds-toast-${t.type}`}>
            <span className="ds-toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'ℹ'}
            </span>
            <span className="ds-toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        .ds-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 10000;
          pointer-events: none;
        }

        .ds-toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background-color: var(--color-bg);
          color: var(--color-ink);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
          min-width: 280px;
          max-width: 420px;
          pointer-events: auto;
          animation: ds-toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-toast-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-weight: bold;
          font-size: 0.85rem;
        }

        .ds-toast-success { border-left: 4px solid var(--color-success); }
        .ds-toast-success .ds-toast-icon { background-color: rgba(21, 128, 61, 0.1); color: var(--color-success); }

        .ds-toast-error { border-left: 4px solid var(--color-danger); }
        .ds-toast-error .ds-toast-icon { background-color: rgba(229, 72, 77, 0.1); color: var(--color-danger); }

        .ds-toast-warning { border-left: 4px solid var(--color-accent); }
        .ds-toast-warning .ds-toast-icon { background-color: rgba(240, 177, 0, 0.1); color: var(--color-accent); }

        .ds-toast-info { border-left: 4px solid var(--color-primary); }
        .ds-toast-info .ds-toast-icon { background-color: rgba(234, 88, 12, 0.1); color: var(--color-primary); }

        .ds-toast-message {
          font-family: 'Roboto', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
        }

        @keyframes ds-toast-in {
          from {
            transform: translateX(100%) translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
