import { useState, useEffect, useRef, useCallback } from 'react';

export interface RestoreProgressState {
  isRunning: boolean;
  processed: number;
  total: number;
  percentage: number;
  currentTable: string;
  message: string;
  isComplete: boolean;
  error: string | null;
  warnings: Array<{ table: string; error: string; message: string }>;
}

export function useRestoreProgress() {
  const [state, setState] = useState<RestoreProgressState>({
    isRunning: false,
    processed: 0,
    total: 0,
    percentage: 0,
    currentTable: '',
    message: '',
    isComplete: false,
    error: null,
    warnings: []
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setState({
      isRunning: false,
      processed: 0,
      total: 0,
      percentage: 0,
      currentTable: '',
      message: '',
      isComplete: false,
      error: null,
      warnings: []
    });
  }, []);

  const cancelRestore = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      message: 'Restauración cancelada'
    }));
  }, []);

  const startRestore = useCallback(async (respaldoId: string, adminId: string) => {
    // Resetear estado anterior
    resetState();

    // Crear AbortController para cancelación
    abortControllerRef.current = new AbortController();

    try {
      // Construir URL con parámetros
      const url = new URL('/api/restore-progress', window.location.origin);
      url.searchParams.set('respaldoId', respaldoId);
      url.searchParams.set('adminId', adminId);

      // Crear EventSource para SSE
      eventSourceRef.current = new EventSource(url.toString());

      // Actualizar estado a "iniciando"
      setState(prev => ({
        ...prev,
        isRunning: true,
        message: 'Conectando con el servidor...'
      }));

      // Manejar eventos
      eventSourceRef.current.onopen = () => {
        console.log('🔌 Conectado a /api/restore-progress');
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: 'Error de conexión con el servidor'
        }));
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };

      eventSourceRef.current.addEventListener('start', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('🚀 Restauración iniciada:', data);
        setState(prev => ({
          ...prev,
          message: data.message
        }));
      });

      eventSourceRef.current.addEventListener('progress', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('📊 Progreso restauración:', data);
        setState(prev => ({
          ...prev,
          processed: data.processed,
          total: data.total,
          currentTable: data.currentTable,
          percentage: data.percentage,
          message: data.message
        }));
      });

      eventSourceRef.current.addEventListener('warning', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.warn('⚠️ Advertencia en restauración:', data);
        setState(prev => ({
          ...prev,
          warnings: [...prev.warnings, data]
        }));
      });

      eventSourceRef.current.addEventListener('complete', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('✅ Restauración completada:', data);
        setState(prev => ({
          ...prev,
          isRunning: false,
          isComplete: true,
          message: data.message
        }));
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      });

      eventSourceRef.current.addEventListener('error', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.error('❌ Error en restauración:', data);
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: data.message,
          message: data.error || 'Error durante la restauración'
        }));
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      });

      eventSourceRef.current.addEventListener('cancelled', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('🚫 Restauración cancelada:', data);
        setState(prev => ({
          ...prev,
          isRunning: false,
          message: data.message
        }));
      });

    } catch (error) {
      console.error('❌ Error iniciando restauración:', error);
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, [resetState]);

  // Limpiar conexión al desmontar
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    // Estado
    isRunning: state.isRunning,
    processed: state.processed,
    total: state.total,
    percentage: state.percentage,
    currentTable: state.currentTable,
    message: state.message,
    isComplete: state.isComplete,
    error: state.error,
    warnings: state.warnings,
    
    // Métodos
    startRestore,
    cancelRestore,
    resetState
  };
}
