'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { useBackupProgress } from '@/hooks/use-backup-progress';
import { useRestoreProgress } from '@/hooks/use-restore-progress';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { BuildingOfficeIcon, CreditCardIcon, PhoneIcon, CheckCircleIcon, ExclamationTriangleIcon, CloudArrowDownIcon, ArrowPathIcon, TrashIcon, CloudArrowUpIcon, LockClosedIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  exportarSistemaMaestroAction,
  obtenerRespaldosSistemaMaestroAction,
  eliminarRespaldoSistemaMaestroAction,
  restaurarDesdeBDAction,
  crearRespaldoCompletoAction,
  obtenerDatosTablaAction,
  guardarRespaldoFinalAction
} from '@/app/actions/admin';

interface ConfiguracionGlobal {
  id?: string;
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  titular: string;
  documento_titular: string;
  porcentaje_iva: string;
  whatsapp_soporte: string;
  mensaje_global: string;
  direccion: string;
  ciudad: string;
  logo_url: string;
  creado_en?: string;
  actualizado_en?: string;
}

export default function AdminConfiguracionPage() {
  const { user } = useJWTAuth();
  const { showToast } = useToast();
  
  // Hook para manejar progreso de respaldos en tiempo real
  const backupProgress = useBackupProgress();
  
  // Hook para manejar progreso de restauración en tiempo real
  const restoreProgress = useRestoreProgress();
  
  const [config, setConfig] = useState<ConfiguracionGlobal>({
    banco: '',
    tipo_cuenta: '',
    numero_cuenta: '',
    titular: '',
    documento_titular: '',
    porcentaje_iva: '',
    whatsapp_soporte: '',
    mensaje_global: '',
    direccion: '',
    ciudad: '',
    logo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Estados para respaldos del sistema maestro
  const [respaldos, setRespaldos] = useState<any[]>([]);
  const [loadingRespaldos, setLoadingRespaldos] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [deletingRespaldo, setDeletingRespaldo] = useState<string | null>(null);
  const [restoringRespaldo, setRestoringRespaldo] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string>('');
  const [currentTable, setCurrentTable] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRespaldo, setSelectedRespaldo] = useState<any>(null);
  const [fileRestoreModal, setFileRestoreModal] = useState<{ isOpen: boolean; backupData: any; fileName: string }>({
    isOpen: false,
    backupData: null,
    fileName: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para cargar respaldos del sistema maestro
  const cargarRespaldos = async () => {
    try {
      setLoadingRespaldos(true);
      const result = await obtenerRespaldosSistemaMaestroAction();

      if (!result.success) {
        showToast(result.error || 'Error al cargar respaldos', 'error');
        return;
      }

      setRespaldos(result.data || []);
    } catch (error) {
      console.error('Error cargando respaldos:', error);
      showToast('Error al cargar los respaldos', 'error');
    } finally {
      setLoadingRespaldos(false);
    }
  };

  // Función para crear respaldo del sistema maestro
  const handleCrearRespaldo = async () => {
    if (!user?.id) {
      showToast('Usuario no autenticado', 'error');
      return;
    }

    try {
      setCreatingBackup(true);
      const result = await exportarSistemaMaestroAction(user.id);

      console.log('🔍 Resultado de exportarSistemaMaestroAction:', result);

      if (!result.success) {
        showToast(result.error || 'Error al crear respaldo', 'error');
        return;
      }

      showToast('Respaldo creado exitosamente', 'success');

      // Recargar respaldos desde la base de datos para garantizar que se muestren
      await cargarRespaldos();

    } catch (error) {
      console.error('Error creando respaldo:', error);
      showToast('Error inesperado al crear respaldo', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  // Función para crear respaldo completo de la base de datos con progreso en tiempo real
  const handleCrearRespaldoCompleto = async () => {
    if (!user?.id) {
      showToast('Error: Usuario no autenticado', 'error');
      return;
    }

    try {
      console.log('🟢 Iniciando respaldo completo con progreso en tiempo real');
      
      // Iniciar respaldo con progreso usando el hook
      await backupProgress.startBackup(user.id);
      
    } catch (error) {
      console.error('Error iniciando respaldo completo:', error);
      showToast('Error inesperado al iniciar respaldo completo', 'error');
    }
  };

  // Función para cancelar respaldo en progreso
  const handleCancelarRespaldo = () => {
    backupProgress.cancelBackup();
    showToast('Respaldo cancelado', 'info');
  };

  // Función para descargar respaldo
  const handleDescargar = (respaldo: any) => {
    const dataStr = JSON.stringify(respaldo.datos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${respaldo.nombre_archivo}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para eliminar respaldo
  const handleEliminar = async () => {
    console.log('🔴 Botón clickeado. ID:', selectedRespaldo?.id, 'Nombre:', selectedRespaldo?.nombre_archivo);
    
    if (!selectedRespaldo || !user?.id) {
      console.error('❌ Parámetros inválidos:', { selectedRespaldo, userId: user?.id });
      return;
    }

    // Validar que los parámetros no sean undefined
    if (!selectedRespaldo.id || !selectedRespaldo.nombre_archivo) {
      console.error('❌ ID o nombre_archivo undefined:', { 
        id: selectedRespaldo.id, 
        nombre_archivo: selectedRespaldo.nombre_archivo 
      });
      showToast('Error: Datos del respaldo incompletos', 'error');
      return;
    }

    try {
      setDeletingRespaldo(selectedRespaldo.id);
      console.log('🔴 Enviando al backend:', { 
        id: selectedRespaldo.id, 
        adminId: user.id 
      });
      
      const result = await eliminarRespaldoSistemaMaestroAction(selectedRespaldo.id, user.id);
      console.log('🔴 Resultado del servidor:', result);

      if (!result.success) {
        showToast(result.error || 'Error al eliminar respaldo', 'error');
        setShowDeleteModal(false);
        setSelectedRespaldo(null);
        return;
      }

      // Actualización optimista
      setRespaldos(prev => prev.filter(r => r.id !== selectedRespaldo.id));
      showToast('Respaldo eliminado exitosamente', 'success');
      setShowDeleteModal(false);
      setSelectedRespaldo(null);

    } catch (error) {
      console.error('Error eliminando respaldo:', error);
      showToast('Error inesperado al eliminar respaldo', 'error');
    } finally {
      setDeletingRespaldo(null);
    }
  };

  // Función para restaurar respaldo con progreso en tiempo real
  const handleRestaurar = async () => {
    if (!selectedRespaldo || !user?.id) return;

    try {
      console.log('🔄 Iniciando restauración con progreso en tiempo real');
      
      // Cerrar modal y limpiar selección
      setShowRestoreModal(false);
      setSelectedRespaldo(null);
      
      // Iniciar restauración con progreso usando el hook
      await restoreProgress.startRestore(selectedRespaldo.id, user.id);
      
    } catch (error) {
      console.error('Error iniciando restauración:', error);
      showToast('Error inesperado al iniciar restauración', 'error');
    }
  };

  // Función para cancelar restauración en progreso
  const handleCancelarRestauracion = () => {
    restoreProgress.cancelRestore();
    showToast('Restauración cancelada', 'info');
  };

  // Función para manejar la restauración desde archivo local
  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
      showToast('Por favor selecciona un archivo JSON válido', 'error');
      return;
    }

    setRestoringBackup(true);
    setRestoreMessage('Leyendo archivo de respaldo...');

    try {
      // Leer el archivo JSON
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          setRestoringBackup(false);
          setRestoreMessage('');
          // Abrir modal de confirmación
          setFileRestoreModal({
            isOpen: true,
            backupData,
            fileName: file.name
          });
        } catch (parseError) {
          console.error('Error parseando JSON:', parseError);
          showToast('Error al leer el archivo JSON. Verifica que el formato sea correcto.', 'error');
          setRestoringBackup(false);
          setRestoreMessage('');
        }
      };

      reader.onerror = () => {
        showToast('Error al leer el archivo', 'error');
        setRestoringBackup(false);
        setRestoreMessage('');
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error en restauración:', error);
      showToast('Error al procesar el archivo', 'error');
      setRestoringBackup(false);
      setRestoreMessage('');
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = '';
    }
  };

  // Función para confirmar restauración desde archivo externo
  const confirmFileRestore = async () => {
    if (!fileRestoreModal.backupData || !user?.id) return;

    setFileRestoreModal({ isOpen: false, backupData: null, fileName: '' });
    setRestoringBackup(true);
    setRestoreMessage('Iniciando restauración desde archivo externo...');

    try {
      // Para respaldos del sistema maestro, procesamos las tablas globales
      const backupData = fileRestoreModal.backupData.datos || fileRestoreModal.backupData;

      // Mapeo de tablas globales - corrección de nombres
      const tableMapping: Record<string, string> = {
        'usuarios_staff': 'usuarios_sistema',
        'comunicacion': 'configuracion_global',
        'configuracion': 'configuracion_global',
        'ayuda': 'articulos_ayuda',
        'tickets': 'tickets_soporte',
        'marketing': 'marketing_campaigns'
      };

      // Orden de prioridad para tablas críticas
      const priorityOrder = [
        'usuarios_staff',
        'comunicacion',
        'configuracion',
        'planes',
        'ayuda',
        'tickets',
        'marketing'
      ];

      let processedTables = 0;
      const processedTableNames = new Set<string>();
      const failedTables = new Set<string>();

      // Función para procesar una tabla específica
      const processTable = async (tableName: string) => {
        try {
          setCurrentTable(tableName);
          setRestoreMessage(`Restaurando tabla: ${tableName}...`);

          const tableData = backupData[tableName];

          // Saltar si no hay datos
          if (!tableData || (Array.isArray(tableData) && tableData.length === 0)) {
            processedTables++;
            processedTableNames.add(tableName);
            return;
          }

          // Para tablas que no son arrays (como configuracion)
          let dataToInsert;
          if (Array.isArray(tableData)) {
            dataToInsert = tableData;
          } else if (tableData && typeof tableData === 'object' && 'registros' in tableData) {
            // Formato nuevo: {columnas: [], registros: []}
            dataToInsert = Array.isArray(tableData.registros) ? tableData.registros : [];
          } else {
            dataToInsert = [tableData];
          }

          // Mapeo de nombres de tablas
          const actualTableName = tableMapping[tableName] || tableName;

          // Usar upsert para cada tabla con ignoreDuplicates para manejar conflictos
          const supabase = createClient();
          const { error } = await (supabase.from(actualTableName) as any)
            .upsert(dataToInsert, { 
              onConflict: 'id',
              ignoreDuplicates: true 
            });

          if (error) {
            console.error(`Error en tabla ${actualTableName}:`, error);
            // Si es un error de conflicto (409), no lo consideramos como fallo
            if (error.code === '409' || error.message?.includes('duplicate')) {
              console.log(`⚠️  Tabla ${actualTableName}: Algunos registros ya existen, continuando...`);
              processedTableNames.add(tableName);
            } else {
              failedTables.add(tableName);
            }
          } else {
            processedTableNames.add(tableName);
          }

          processedTables++;

          // Pequeña pausa para no sobrecargar la base de datos
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (tableError) {
          console.error(`Error procesando tabla ${tableName}:`, tableError);
          failedTables.add(tableName);
          processedTables++;
        }
      };

      // Procesar tablas de prioridad
      for (const tableName of priorityOrder) {
        if (backupData[tableName]) {
          await processTable(tableName);
        }
      }

      // Procesar todas las demás tablas
      const allTableNames = Object.keys(backupData);
      const remainingTables = allTableNames.filter(name => !processedTableNames.has(name) && !failedTables.has(name));

      for (const tableName of remainingTables) {
        await processTable(tableName);
      }

      // Restauración completada
      const messageBase = failedTables.size > 0
        ? `Restauración completada con ${failedTables.size} error(es). ${processedTableNames.size} tablas restauradas.`
        : `¡Restauración completada! ${processedTableNames.size} tablas restauradas.`;

      setRestoreMessage(`${messageBase} Refrescando página...`);
      setRestoringBackup(false);
      setCurrentTable('');

      // Refrescar la página después de un momento
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error en restauración desde archivo:', error);
      showToast('Error al restaurar el archivo externo', 'error');
      setRestoringBackup(false);
      setRestoreMessage('');
    }
  };

  // Función para cancelar restauración desde archivo externo
  const cancelFileRestore = () => {
    setFileRestoreModal({ isOpen: false, backupData: null, fileName: '' });
  };

  // Cargar respaldos al montar el componente
  useEffect(() => {
    if (user && user.rol === 'admin_global') {
      cargarRespaldos();
    }
  }, [user]);

  // Verificar rol de admin global
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.rol !== 'admin_global') {
      router.push('/admin/dashboard-admin');
      return;
    }
  }, [user, router]);

  // Cargar configuración existente
  useEffect(() => {
    if (!user || user.rol !== 'admin_global') {
      return;
    }

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/configuracion-global');
        const data = await response.json();

        if (data.config) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar configuración existente'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [user]);

  // Effect para manejar eventos del hook de progreso de respaldos
  useEffect(() => {
    // Manejar evento de completado
    if (backupProgress.isComplete) {
      showToast('Respaldo completo de la base de datos creado exitosamente', 'success');
      cargarRespaldos(); // Recargar lista de respaldos
      backupProgress.resetState(); // Resetear estado del hook
    }

    // Manejar evento de error
    if (backupProgress.error) {
      showToast(backupProgress.error, 'error');
      backupProgress.resetState(); // Resetear estado del hook
    }
  }, [backupProgress.isComplete, backupProgress.error, showToast]);

  // Effect para manejar eventos del hook de progreso de restauración
  useEffect(() => {
    // Manejar evento de completado
    if (restoreProgress.isComplete) {
      showToast('Sistema restaurado exitosamente', 'success');
      
      // Mostrar advertencias si hay alguna
      if (restoreProgress.warnings.length > 0) {
        restoreProgress.warnings.forEach(warning => {
          showToast(warning.message, 'warning');
        });
      }
      
      // Refrescar la página para cargar la nueva configuración
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      restoreProgress.resetState(); // Resetear estado del hook
    }

    // Manejar evento de error
    if (restoreProgress.error) {
      showToast(restoreProgress.error, 'error');
      restoreProgress.resetState(); // Resetear estado del hook
    }
  }, [restoreProgress.isComplete, restoreProgress.error, restoreProgress.warnings, showToast]);

  const handleInputChange = (field: keyof ConfiguracionGlobal, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (500KB como en empresas)
    if (file.size > 500 * 1024) {
      setMessage({
        type: 'error',
        text: 'El archivo no debe superar los 500 KB'
      });
      return;
    }

    // Validar formato (mismos formatos que empresas + SVG)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'El formato debe ser JPG, PNG, WebP o SVG'
      });
      return;
    }

    // Convertir a Base64 (método de empresas)
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setConfig(prev => ({
        ...prev,
        logo_url: base64String
      }));
      
      setMessage({
        type: 'success',
        text: 'Logo cargado exitosamente'
      });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!config.banco || !config.numero_cuenta || !config.titular) {
      setMessage({
        type: 'error',
        text: 'Los campos de banco, número de cuenta y titular son obligatorios'
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/configuracion-global', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...config,
          adminId: user?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: '✅ ¡Configuración global actualizada con éxito!'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al guardar configuración'
        });
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar configuración'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración Global</h1>
          <p className="text-gray-600 mt-1">
            Administra los datos de pago que verán los clientes
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Logo Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Logo de la Empresa</h2>
            </div>
            <p className="text-sm text-gray-600">
              Sube el logo que se mostrará en los documentos y comunicaciones
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                Logo de la Empresa
              </label>
              <div className="flex items-center gap-4">
                {config.logo_url && (
                  <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img 
                      src={config.logo_url} 
                      alt="Logo de la empresa" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    id="logo"
                    type="file"
                    accept="image/jpeg, image/jpg, image/png, image/webp, image/svg+xml, .svg"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, WebP, SVG. Máximo 500KB
                  </p>
                </div>
              </div>
                          </div>
          </CardContent>
        </Card>

        {/* Datos Bancarios Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Datos Bancarios</h2>
            </div>
            <p className="text-sm text-gray-600">
              Configura la información bancaria que los clientes verán al realizar pagos
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="banco" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Banco *
                  </label>
                  <input
                    id="banco"
                    type="text"
                    value={config.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    placeholder="Ej: Banco Nacional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="tipo_cuenta" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <input
                    id="tipo_cuenta"
                    type="text"
                    value={config.tipo_cuenta}
                    onChange={(e) => handleInputChange('tipo_cuenta', e.target.value)}
                    placeholder="Ej: Cuenta Corriente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="numero_cuenta" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Cuenta *
                  </label>
                  <input
                    id="numero_cuenta"
                    type="text"
                    value={config.numero_cuenta}
                    onChange={(e) => handleInputChange('numero_cuenta', e.target.value)}
                    placeholder="Ej: 1234-5678-9012"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="titular" className="block text-sm font-medium text-gray-700 mb-2">
                    Titular de la Cuenta *
                  </label>
                  <input
                    id="titular"
                    type="text"
                    value={config.titular}
                    onChange={(e) => handleInputChange('titular', e.target.value)}
                    placeholder="Ej: Mi Empresa S.A."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp_soporte" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp de Soporte
                  </label>
                  <input
                    id="whatsapp_soporte"
                    type="text"
                    value={config.whatsapp_soporte}
                    onChange={(e) => handleInputChange('whatsapp_soporte', e.target.value)}
                    placeholder="Ej: +593 987 654 321"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    value={config.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    placeholder="Ej: Calle 123 #45-67"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    id="ciudad"
                    type="text"
                    value={config.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Ej: Quibdó"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="documento_titular" className="block text-sm font-medium text-gray-700 mb-2">
                    Documento del Titular
                  </label>
                  <input
                    id="documento_titular"
                    type="text"
                    value={config.documento_titular}
                    onChange={(e) => handleInputChange('documento_titular', e.target.value)}
                    placeholder="Ej: 1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="porcentaje_iva" className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de IVA
                  </label>
                  <input
                    id="porcentaje_iva"
                    type="text"
                    value={config.porcentaje_iva}
                    onChange={(e) => handleInputChange('porcentaje_iva', e.target.value)}
                    placeholder="Ej: 16.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="mensaje_global" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje Global
                  </label>
                  <textarea
                    id="mensaje_global"
                    value={config.mensaje_global}
                    onChange={(e) => handleInputChange('mensaje_global', e.target.value)}
                    placeholder="Mensaje para todas las empresas..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/dashboard-admin')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Información Importante Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Importante</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Los campos marcados con * son obligatorios.</p>
              <p>• Estos datos serán visibles para todos los clientes al momento de realizar pagos.</p>
              <p>• Solo los administradores globales pueden modificar esta configuración.</p>
              <p>• Los cambios se reflejarán inmediatamente en el modal de pago de los clientes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Respaldos del Sistema Maestro Card */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 border-b-0">
            <div className="flex items-center gap-3">
              <LockClosedIcon className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Respaldos del Sistema Maestro</h2>
            </div>
            <p className="text-amber-100 text-sm mt-1">
              Gestiona los respaldos de la configuración global y datos del sistema
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative group">
                <Button
                  onClick={handleCrearRespaldo}
                  disabled={creatingBackup}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Genera una copia completa de todas las tablas del sistema"
                >
                  {creatingBackup ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando Respaldo...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                      Generar y Guardar Respaldo
                    </>
                  )}
                </Button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  💾 Genera una copia completa de todas las tablas del sistema y la guarda en la nube
                </div>
              </div>
              
              <div className="relative group">
                <Button
                  onClick={handleCrearRespaldoCompleto}
                  disabled={backupProgress.isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Respaldar TODAS las tablas de la base de datos con progreso en tiempo real"
                >
                  {backupProgress.isRunning ? (
                    <>
                      <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${
                        backupProgress.currentTable === 'Subiendo archivo al Storage...' ? 'border-green-400' : 'border-white'
                      }`}></div>
                      ⚙️ ({backupProgress.processed}/{backupProgress.total}) Respaldando {backupProgress.currentTable}...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                      Respaldar Base de Datos Completa
                    </>
                  )}
                </Button>
                
                {/* Botón de cancelar cuando está en progreso */}
                {backupProgress.isRunning && (
                  <Button
                    onClick={handleCancelarRespaldo}
                    variant="outline"
                    className="mt-2 w-full border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancelar Respaldo
                  </Button>
                )}
                
                {/* Barra de progreso en tiempo real */}
                {backupProgress.isRunning && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          backupProgress.currentTable === 'Subiendo archivo al Storage...' 
                            ? 'bg-green-600' 
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${backupProgress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      {backupProgress.percentage}% completado
                    </p>
                    {backupProgress.message && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {backupProgress.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sección de progreso de restauración */}
              {restoreProgress.isRunning && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">🔄 Restauración en Progreso</h4>
                  
                  {/* Barra de progreso de restauración */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300 bg-green-600"
                        style={{ width: `${restoreProgress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      {restoreProgress.percentage}% completado
                    </p>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      ({restoreProgress.processed}/{restoreProgress.total}) {restoreProgress.currentTable}
                    </p>
                    {restoreProgress.message && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {restoreProgress.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Botón de cancelar restauración */}
                  <Button
                    onClick={handleCancelarRestauracion}
                    variant="outline"
                    className="mt-2 w-full border-red-600 text-red-600 hover:bg-red-50"
                    size="sm"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancelar Restauración
                  </Button>
                  
                  {/* Advertencias si hay alguna */}
                  {restoreProgress.warnings.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        ⚠️ {restoreProgress.warnings.length} advertencia(s) durante la restauración
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="relative group">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoringBackup}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Sube y restaura un archivo JSON de respaldo externo"
                >
                  {restoringBackup ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                      Subir y Restaurar Backup Externo
                    </>
                  )}
                </Button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  📁 Sube un archivo JSON externo y restaura usando el sistema de integridad referencial
                </div>
              </div>

              <div className="relative group">
                <Button
                  variant="outline"
                  onClick={cargarRespaldos}
                  disabled={loadingRespaldos}
                  className="border-amber-600 text-amber-600 hover:bg-amber-50 font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Refresca la tabla del historial consultando nuevamente a Supabase"
                >
                  {loadingRespaldos ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CloudArrowDownIcon className="w-5 h-5 mr-2" />
                      Actualizar Lista
                    </>
                  )}
                </Button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                  🔄 Refresca la tabla del historial consultando nuevamente a Supabase
                </div>
              </div>
            </div>

            {/* Input de archivo oculto para restauración */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />

            {/* Mensaje de progreso de restauración */}
            {restoringBackup && restoreMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <div>
                    <p className="text-blue-800 font-medium">{restoreMessage}</p>
                    {currentTable && (
                      <p className="text-blue-600 text-sm">Tabla actual: {currentTable}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Historial de Respaldos */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h3 className="text-lg font-semibold text-gray-800">Historial de Respaldos</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Todos los respaldos del sistema guardados en la nube
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Nombre del Archivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {respaldos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <CloudArrowDownIcon className="w-8 h-8 text-gray-400" />
                            <span>No hay respaldos guardados aún</span>
                            <span className="text-sm text-gray-400">
                              Crea tu primer respaldo para proteger los datos del sistema
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      respaldos.map((respaldo) => (
                        <tr key={respaldo.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(respaldo.created_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                            {respaldo.nombre_archivo}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                              Manual
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex gap-2 justify-end">
                              <div className="relative group">
                                <Button
                                  onClick={() => handleDescargar(respaldo)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                  title="Descarga el respaldo a tu computadora en formato JSON"
                                >
                                  <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                                  Descargar
                                </Button>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                  📥 Descarga la "caja fuerte" guardada en tu computadora como archivo JSON
                                </div>
                              </div>
                              <div className="relative group">
                                <Button
                                  onClick={() => {
                                    setSelectedRespaldo(respaldo);
                                    setShowRestoreModal(true);
                                  }}
                                  disabled={restoringBackup}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                  title="Restaura directamente este respaldo desde la nube"
                                >
                                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                                  Restaurar
                                </Button>
                                {/* Tooltip */}
                                <div className="absolute bottom-full right-0 transform translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                  🔄 Restaura directamente desde la nube sobrescribiendo todos los datos actuales
                                </div>
                              </div>
                              <div className="relative group">
                                <Button
                                  onClick={() => {
                                    setSelectedRespaldo(respaldo);
                                    setShowDeleteModal(true);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                  title="Elimina permanentemente el respaldo de la base de datos"
                                >
                                  <TrashIcon className="w-4 h-4 mr-1" />
                                </Button>
                                {/* Tooltip */}
                                <div className="absolute bottom-full right-0 transform translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                  🗑️ Borra permanentemente el registro del respaldo para limpiar copias antiguas
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && selectedRespaldo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Eliminar Respaldo</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el respaldo "<span className="font-medium text-gray-800">{selectedRespaldo.nombre_archivo}</span>"?
              <br />
              <span className="text-sm text-gray-500">Esta acción no se puede deshacer. El respaldo será eliminado permanentemente.</span>
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRespaldo(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEliminar}
                disabled={deletingRespaldo === selectedRespaldo.id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingRespaldo === selectedRespaldo.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Restauración */}
      {showRestoreModal && selectedRespaldo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <ArrowPathIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Restaurar Sistema</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas restaurar el sistema desde el respaldo "<span className="font-medium text-gray-800">{selectedRespaldo.nombre_archivo}</span>"?
              <br />
              <span className="text-sm text-gray-500">Esta acción sobrescribirá los datos actuales del sistema. Se recomienda crear un respaldo antes de continuar.</span>
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedRespaldo(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRestaurar}
                disabled={restoringRespaldo === selectedRespaldo.id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {restoringRespaldo === selectedRespaldo.id ? 'Restaurando...' : 'Restaurar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Restauración desde Archivo Externo */}
      {fileRestoreModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1c130d] border border-green-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <CloudArrowUpIcon className="w-6 h-6 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-amber-100">
                Confirmar Restauración desde Archivo
              </h3>
            </div>

            <p className="text-amber-200 mb-6">
              ¿Estás seguro de restaurar el archivo "<span className="font-medium text-amber-100">{fileRestoreModal.fileName}</span>"?
            </p>

            <p className="text-amber-300 text-sm mb-6">
              Se sobrescribirán todos los datos actuales del sistema con la información de este archivo externo. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={cancelFileRestore}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmFileRestore}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Restaurar
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
