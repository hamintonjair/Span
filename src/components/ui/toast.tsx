'use client';

import React, { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // ✅ Fallback de seguridad: imprimir en consola en lugar de romper la aplicación
    return {
      showToast: (message: string, type: Toast['type'] = 'success', duration?: number) => {
        console.log(`Toast [${type.toUpperCase()}]: ${message}`);
        // Intentar mostrar toast de forma alternativa si es posible
        try {
          // Toast nativo del navegador como fallback
          if (type === 'error') {
            console.error(message);
          } else if (type === 'warning') {
            console.warn(message);
          } else {
            console.log(message);
          }
        } catch (e) {
          console.error('Error showing fallback toast:', e);
        }
      },
      success: (message: string, duration?: number) => {
        console.log(`Toast [SUCCESS]: ${message}`);
      },
      error: (message: string, duration?: number) => {
        console.error(`Toast [ERROR]: ${message}`);
      },
      warning: (message: string, duration?: number) => {
        console.warn(`Toast [WARNING]: ${message}`);
      },
      info: (message: string, duration?: number) => {
        console.log(`Toast [INFO]: ${message}`);
      }
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success', duration = 3000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Métodos de conveniencia
  const success = (message: string, duration?: number) => showToast(message, 'success', duration);
  const error = (message: string, duration?: number) => showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        text-white px-4 py-3 rounded-lg shadow-lg border-2
        min-w-[300px] max-w-md
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        flex items-center space-x-3
      `}
    >
      <span className="text-xl font-bold">{getIcon()}</span>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-3 text-white hover:text-gray-200 transition-colors"
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}

// Función de conveniencia para exportar
export const toast = {
  success: (message: string, duration?: number) => {
    // Esta función será inicializada cuando se use el ToastProvider
    console.log('Toast success:', message);
  },
  error: (message: string, duration?: number) => {
    console.log('Toast error:', message);
  },
  warning: (message: string, duration?: number) => {
    console.log('Toast warning:', message);
  },
  info: (message: string, duration?: number) => {
    console.log('Toast info:', message);
  }
};

// Exportar showToast para compatibilidad
export function showToast(message: string, type: Toast['type'] = 'success', duration?: number) {
  console.log(`Toast [${type.toUpperCase()}]: ${message}`);
  
  // Intentar mostrar notificación nativa como fallback
  if (typeof window !== 'undefined') {
    if (type === 'error') {
      console.error(message);
    } else if (type === 'warning') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
}
