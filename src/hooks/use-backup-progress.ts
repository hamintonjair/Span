'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BackupProgressState {
  isRunning: boolean;
  currentTable: string;
  processed: number;
  total: number;
  percentage: number;
  message: string;
  error: string | null;
  isComplete: boolean;
  backupId?: string;
  fileName?: string;
}

export function useBackupProgress() {
  const [state, setState] = useState<BackupProgressState>({
    isRunning: false,
    currentTable: '',
    processed: 0,
    total: 33,
    percentage: 0,
    message: '',
    error: null,
    isComplete: false
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpiar conexión
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Iniciar respaldo con progreso en tiempo real
  const startBackup = useCallback(async (adminId: string) => {
    try {
      // Limpiar conexiones anteriores
      cleanup();

      // Resetear estado
      setState({
        isRunning: true,
        currentTable: '',
        processed: 0,
        total: 33,
        percentage: 0,
        message: 'Iniciando respaldo...',
        error: null,
        isComplete: false
      });

      // Crear AbortController para poder cancelar
      abortControllerRef.current = new AbortController();

      // Crear EventSource para SSE
      const url = `/api/backup-progress?adminId=${encodeURIComponent(adminId)}`;
      eventSourceRef.current = new EventSource(url);

      // Manejar mensajes
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('📡 [SSE] Mensaje recibido:', data);

          switch (data.type) {
            case 'start':
              setState(prev => ({
                ...prev,
                message: data.message,
                total: data.total,
                processed: data.procesadas,
                percentage: Math.round((data.procesadas / data.total) * 100)
              }));
              break;

            case 'progress':
              setState(prev => ({
                ...prev,
                message: data.message,
                currentTable: data.tablaActual,
                processed: data.procesadas,
                percentage: data.porcentaje
              }));
              break;

            case 'uploading':
              setState(prev => ({
                ...prev,
                message: data.message,
                currentTable: data.tablaActual,
                processed: data.procesadas,
                percentage: 100
              }));
              break;

            case 'complete':
              setState(prev => ({
                ...prev,
                isRunning: false,
                message: data.message,
                currentTable: data.tablaActual,
                processed: data.procesadas,
                percentage: 100,
                isComplete: true,
                backupId: data.backupId,
                fileName: data.nombreArchivo
              }));
              cleanup();
              break;

            case 'error':
              setState(prev => ({
                ...prev,
                isRunning: false,
                error: data.message || data.error,
                isComplete: false
              }));
              cleanup();
              break;

            default:
              console.warn('📡 [SSE] Tipo de mensaje no manejado:', data.type);
          }
        } catch (error) {
          console.error('📡 [SSE] Error parseando mensaje:', error);
          setState(prev => ({
            ...prev,
            isRunning: false,
            error: 'Error procesando respuesta del servidor'
          }));
          cleanup();
        }
      };

      // Manejar errores de conexión
      eventSourceRef.current.onerror = (error) => {
        console.error('📡 [SSE] Error en EventSource:', error);
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: 'Error de conexión con el servidor'
        }));
        cleanup();
      };

      // Manejar conexión abierta
      eventSourceRef.current.onopen = () => {
        console.log('📡 [SSE] Conexión establecida');
      };

    } catch (error) {
      console.error('📡 [SSE] Error iniciando respaldo:', error);
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Error iniciando respaldo'
      }));
      cleanup();
    }
  }, [cleanup]);

  // Cancelar respaldo
  const cancelBackup = useCallback(() => {
    console.log('📡 [SSE] Cancelando respaldo...');
    cleanup();
    setState(prev => ({
      ...prev,
      isRunning: false,
      message: 'Respaldo cancelado',
      error: null
    }));
  }, [cleanup]);

  // Resetear estado
  const resetState = useCallback(() => {
    cleanup();
    setState({
      isRunning: false,
      currentTable: '',
      processed: 0,
      total: 33,
      percentage: 0,
      message: '',
      error: null,
      isComplete: false
    });
  }, [cleanup]);

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // Estado
    ...state,
    
    // Acciones
    startBackup,
    cancelBackup,
    resetState,
    
    // Utilidades
    isActive: state.isRunning && !state.isComplete,
    canCancel: state.isRunning && !state.isComplete
  };
}
