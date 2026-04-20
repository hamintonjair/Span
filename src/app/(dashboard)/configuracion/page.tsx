'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { getDirectDriveUrl } from '@/utils/drive-url';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BuildingOfficeIcon, PhoneIcon, MapPinIcon, DocumentTextIcon, PhotoIcon, CheckCircleIcon, ExclamationTriangleIcon, CreditCardIcon, CalendarIcon, LockClosedIcon, CloudArrowDownIcon, CloudArrowUpIcon, DocumentArrowDownIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Eliminamos interfaces para evitar errores de TypeScript

export default function ConfiguracionPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nombre: '',
    nit: '',
    telefono: '',
    direccion: '',
    ciudad: 'Quibdó',
    mensaje_ticket: '',
    logo_url: ''
  }); // Cast explícito para evitar errores de TypeScript

  // Estados para manejo de logo
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>('');

  // Estados para modal y toast
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; backup: any }>({
    isOpen: false,
    backup: null
  });
  const [restoreModal, setRestoreModal] = useState<{ isOpen: boolean; backup: any }>({
    isOpen: false,
    backup: null
  });
  const [fileRestoreModal, setFileRestoreModal] = useState<{ isOpen: boolean; backupData: any; fileName: string }>({
    isOpen: false,
    backupData: null,
    fileName: ''
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Estados para sistema de respaldos
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string>('');
  const [currentTable, setCurrentTable] = useState<string>('');
  const [frecuenciaRespaldo, setFrecuenciaRespaldo] = useState<string>('Desactivado');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validar y procesar archivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (500KB)
    if (file.size > 500 * 1024) {
      setLogoError('El archivo no debe superar los 500 KB');
      return;
    }

    // Validar formato
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('El formato debe ser JPG, PNG o WebP');
      return;
    }

    setLogoError('');
    setLogoFile(file);

    // Convertir a Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setLogoPreview(base64String);
      setFormData((prev: any) => ({
        ...prev,
        logo_url: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  // Eliminar logo
  const handleEliminarLogo = () => {
    setLogoPreview('');
    setLogoFile(null);
    setFormData((prev: any) => ({
      ...prev,
      logo_url: ''
    }));
    setLogoError('');
  };

  // Cargar datos de la empresa usando empresa_id del usuario
  const cargarEmpresa = async () => {
    if (!user?.empresa_id) return;

    try {
      setLoading(true);
      // Cargar datos de la empresa incluyendo frecuencia_respaldo
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, nit, telefono, direccion, ciudad, mensaje_ticket, logo_url, frecuencia_respaldo')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;

      if (data) {
        // Cast explícito para evitar errores de TypeScript
        const empresaData = data as any;
        setEmpresa(empresaData);
        // Cargar frecuencia de respaldo si existe
        if (empresaData.frecuencia_respaldo) {
          setFrecuenciaRespaldo(empresaData.frecuencia_respaldo);
        }
        setFormData({
          nombre: empresaData.nombre || '',
          nit: empresaData.nit || '',
          telefono: empresaData.telefono || '',
          direccion: empresaData.direccion || '',
          ciudad: empresaData.ciudad || 'Quibdó', // Valor por defecto
          mensaje_ticket: empresaData.mensaje_ticket || '',
          logo_url: empresaData.logo_url || ''
        } as any); // Cast explícito para evitar errores de TypeScript
        
        // Establecer preview si existe logo
        if (empresaData.logo_url) {
          setLogoPreview(empresaData.logo_url);
        }
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos de la empresa' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.empresa_id) {
      cargarEmpresa();
    }
  }, [user?.empresa_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    })); // Cast explícito para evitar errores de TypeScript
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.empresa_id) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    setSaving(true);
    try {
      // Crear objeto de actualización por separado
      const updateData: any = {
        nombre: formData.nombre,
        nit: formData.nit,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        mensaje_ticket: formData.mensaje_ticket,
        logo_url: formData.logo_url
      };
      
      const { error } = await supabase
        .from('empresas')
        // @ts-ignore - Ignorar error de TypeScript para este llamado
        .update(updateData as any)
        .eq('id', user.empresa_id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      await cargarEmpresa(); // Recargar datos
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  // Cargar respaldos existentes
  const cargarBackups = async () => {
    if (!user?.empresa_id) return;
    
    setLoadingBackups(true);
    try {
      const { data, error } = await supabase
        .from('respaldos_datos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error('Error cargando respaldos:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!user?.empresa_id) return;

    setCreatingBackup(true);
    try {
      // 1. Eliminar respaldos anteriores de la empresa
      const { error: deleteError } = await (supabase.from('respaldos_datos') as any)
        .delete()
        .eq('empresa_id', user.empresa_id);

      if (deleteError) {
        console.error('Error eliminando respaldos anteriores:', deleteError);
        // Continuar aunque falle la eliminación
      }

      // 2. Llamar a la función RPC evadiendo TypeScript
      const { data: respaldoJson, error } = await (supabase.rpc as any)('generar_respaldo_completo', {
        p_empresa_id: user.empresa_id
      });

      if (error) throw error;

      // 3. Guardar el resultado evadiendo TypeScript
      const { error: insertError } = await (supabase.from('respaldos_datos') as any)
        .insert({
          empresa_id: user.empresa_id,
          nombre_archivo: `Respaldo_Sistema_${new Date().toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(/\//g, '-').replace(/,\s*/g, '_')}`,
          datos: respaldoJson
        });

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: 'Respaldo creado exitosamente y guardado en la nube' });
      await cargarBackups(); // Asegúrate de que esta función también use 'as any' si da error

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error creando respaldo:', error);
      setMessage({ type: 'error', text: 'Error al crear el respaldo. Intente nuevamente.' });
    } finally {
      setCreatingBackup(false);
    }
  };

  // Función para manejar la restauración desde archivo local
  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
      setToast({
        show: true,
        message: 'Por favor selecciona un archivo JSON válido',
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
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
          setToast({
            show: true,
            message: 'Error al leer el archivo JSON. Verifica que el formato sea correcto.',
            type: 'error'
          });
          setRestoringBackup(false);
          setRestoreMessage('');
          setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        }
      };

      reader.onerror = () => {
        setToast({
          show: true,
          message: 'Error al leer el archivo',
          type: 'error'
        });
        setRestoringBackup(false);
        setRestoreMessage('');
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error en restauración:', error);
      setToast({
        show: true,
        message: 'Error al procesar el archivo',
        type: 'error'
      });
      setRestoringBackup(false);
      setRestoreMessage('');
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = '';
    }
  };

  // Función para confirmar restauración desde archivo externo
  const confirmFileRestore = async () => {
    if (!fileRestoreModal.backupData) return;

    setFileRestoreModal({ isOpen: false, backupData: null, fileName: '' });
    setRestoringBackup(true);
    setRestoreMessage('Iniciando restauración desde archivo externo...');

    try {
      await procesarRestauracion(fileRestoreModal.backupData);
    } catch (error) {
      console.error('Error en restauración desde archivo:', error);
      setToast({
        show: true,
        message: 'Error al restaurar el archivo externo',
        type: 'error'
      });
      setRestoringBackup(false);
      setRestoreMessage('');
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  // Función para cancelar restauración desde archivo externo
  const cancelFileRestore = () => {
    setFileRestoreModal({ isOpen: false, backupData: null, fileName: '' });
  };

  // Función para guardar frecuencia de respaldo
  const handleGuardarFrecuencia = async (frecuencia: string) => {
    if (!user?.empresa_id) return;

    try {
      const { error } = await (supabase.from('empresas') as any)
        .update({ frecuencia_respaldo: frecuencia })
        .eq('id', user.empresa_id);

      if (error) throw error;

      setFrecuenciaRespaldo(frecuencia);
      setToast({
        show: true,
        message: 'Configuración guardada',
        type: 'success'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2000);
    } catch (error) {
      console.error('Error guardando frecuencia de respaldo:', error);
      setToast({
        show: true,
        message: 'Error al guardar la configuración',
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  // Función para descargar respaldo
  const handleDownloadBackup = (backup: any) => {
    const datosJson = JSON.stringify(backup.datos, null, 2);
    const blob = new Blob([datosJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.nombre_archivo}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para restaurar directamente desde la nube
  const handleRestoreFromCloud = async (backup: any) => {
    // Abrir modal de confirmación
    setRestoreModal({ isOpen: true, backup });
  };

  // Función para confirmar restauración desde la nube
  const confirmRestoreFromCloud = async () => {
    if (!restoreModal.backup) return;

    const fechaRespaldo = new Date(restoreModal.backup.created_at).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    setRestoreModal({ isOpen: false, backup: null });
    setRestoringBackup(true);
    setRestoreMessage('Iniciando restauración desde la nube...');

    try {
      const backupData = restoreModal.backup.datos;
      await procesarRestauracion(backupData);
    } catch (error) {
      console.error('Error en restauración desde nube:', error);
      setToast({
        show: true,
        message: 'Error al restaurar el respaldo desde la nube',
        type: 'error'
      });
      setRestoringBackup(false);
      setRestoreMessage('');
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  // Función para cancelar restauración desde la nube
  const cancelRestoreFromCloud = () => {
    setRestoreModal({ isOpen: false, backup: null });
  };

  // Función unificada para procesar restauración desde cualquier fuente
  const procesarRestauracion = async (backupData: any) => {
    // Mapeo de nombres de tablas para corregir discrepancias entre JSON y base de datos
    const tableMapping: Record<string, string> = {
      'empresa': 'empresas'
    };

    // Orden de prioridad para tablas críticas (integridad referencial)
    const priorityOrder = [
      'empresas',
      'categorias',
      'proveedores',
      'clientes',
      'empleados',
      'servicios',
      'productos',
      'cajas',
      'citas',
      'ventas'
    ];

    let processedTables = 0;
    const processedTableNames = new Set<string>();
    const failedTables = new Set<string>();

    // Función para limpiar datos de una tabla
    const cleanTableData = (tableName: string, data: any[]) => {
      return data.map((record: any) => {
        const cleaned = { ...record };

        // Limpieza específica para tabla cajas
        if (tableName === 'cajas') {
          delete cleaned.vendedor_id;
          delete cleaned.creado_por;
        } else {
          // Forzar IDs de usuario para otras tablas
          if (cleaned.creado_por !== undefined && user?.id) {
            cleaned.creado_por = user.id;
          }
          if (cleaned.vendedor_id !== undefined && user?.id) {
            cleaned.vendedor_id = user.id;
          }
        }

        // Asegurar empresa_id del usuario actual (para todas las tablas)
        if (cleaned.empresa_id !== undefined && user?.empresa_id) {
          cleaned.empresa_id = user.empresa_id;
        }

        // Limpiar fechas para que Supabase las genere automáticamente
        delete cleaned.created_at;
        delete cleaned.updated_at;

        return cleaned;
      });
    };

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

        // Para tablas que no son arrays (como empresas)
        const dataToInsert = Array.isArray(tableData) ? tableData : [tableData];

        // Limpiar datos
        const cleanedData = cleanTableData(tableName, dataToInsert);

        // Aplicar mapeo de nombre de tabla si es necesario
        const actualTableName = tableMapping[tableName] || tableName;

        // Log de control antes del upsert
        console.log(`Datos a enviar a ${actualTableName} (original: ${tableName}):`, cleanedData);

        // Usar upsert para cada tabla con el nombre correcto
        const { error } = await (supabase.from(actualTableName) as any)
          .upsert(cleanedData, { onConflict: 'id' });

        if (error) {
          console.error(`Error en tabla ${actualTableName}:`, error);
          failedTables.add(tableName);
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

    // Paso 1: Procesar tablas de prioridad (si existen en el JSON)
    for (const tableName of priorityOrder) {
      if (backupData[tableName]) {
        await processTable(tableName);
      }
    }

    // Paso 2: Procesar todas las demás tablas dinámicamente
    const allTableNames = Object.keys(backupData);
    const remainingTables = allTableNames.filter(name => !processedTableNames.has(name) && !failedTables.has(name));

    for (const tableName of remainingTables) {
      await processTable(tableName);
    }

    // Log final de control
    console.log(`Procesamiento completado.`);
    console.log(`Tablas procesadas exitosamente: ${processedTableNames.size} de ${allTableNames.length}`);
    console.log('Tablas procesadas:', Array.from(processedTableNames));
    if (failedTables.size > 0) {
      console.warn('Tablas con errores:', Array.from(failedTables));
    }

    // Restauración completada - refrescar página
    const messageBase = failedTables.size > 0
      ? `Restauración completada con ${failedTables.size} error(es). ${processedTableNames.size} tablas restauradas.`
      : `¡Restauración completada! ${processedTableNames.size} tablas restauradas.`;

    setRestoreMessage(`${messageBase} Refrescando página...`);
    setRestoringBackup(false);
    setCurrentTable('');

    // Refrescar la página después de un momento para que el usuario vea los cambios
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Función para eliminar respaldo
  const handleDeleteBackup = async (backup: any) => {
    // Abrir modal de confirmación
    setDeleteModal({ isOpen: true, backup });
  };

  // Función para confirmar eliminación
  const confirmDeleteBackup = async () => {
    if (!deleteModal.backup) return;

    try {
      const { error } = await (supabase.from('respaldos_datos') as any)
        .delete()
        .eq('id', deleteModal.backup.id);

      if (error) throw error;

      // Mostrar toast de éxito
      setToast({
        show: true,
        message: 'Respaldo eliminado exitosamente',
        type: 'success'
      });

      await cargarBackups(); // Recargar lista de respaldos
      
      // Cerrar modal
      setDeleteModal({ isOpen: false, backup: null });
      
      // Ocultar toast después de 3 segundos
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Error eliminando respaldo:', error);
      
      // Mostrar toast de error
      setToast({
        show: true,
        message: 'Error al eliminar el respaldo. Intente nuevamente.',
        type: 'error'
      });
      
      // Ocultar toast después de 3 segundos
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  // Función para cancelar eliminación
  const cancelDeleteBackup = () => {
    setDeleteModal({ isOpen: false, backup: null });
  };

  // Cargar respaldos al montar el componente
  useEffect(() => {
    if (user?.empresa_id) {
      cargarBackups();
    }
  }, [user?.empresa_id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando configuración...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Sección de Primeros Pasos */}
        {!empresa || Object.keys(empresa).length === 0 ? (
          <Card className="bg-gradient-to-r from-amber-600 to-amber-700 border-0 shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">¡Bienvenido a BeautyPro!</h2>
                <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
                  Completa los siguientes pasos para configurar tu salón y empezar a usar el sistema
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">1. Datos del Negocio</h3>
                    <p className="text-amber-200 text-sm">Nombre, NIT, teléfono y dirección</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <PhotoIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">2. Logo e Identidad</h3>
                    <p className="text-amber-200 text-sm">Sube el logo de tu salón</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">3. Mensaje de Ticket</h3>
                    <p className="text-amber-200 text-sm">Personaliza tus recibos</p>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-semibold mb-3">Próximos pasos recomendados:</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-left">
                    <div className="flex items-center gap-2 text-amber-100">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-sm">Crear empleados en el módulo de Usuarios</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-100">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-sm">Configurar servicios en Inventario</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-100">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-sm">Agregar productos al inventario</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-100">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-sm">Registrar clientes en el módulo Clientes</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => document.getElementById('empresa-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-amber-700 hover:bg-amber-50 font-medium px-8 py-3 text-lg"
                >
                  Comenzar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 shadow-xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Configuración Completada</h3>
                  <p className="text-green-100 text-sm">
                    Tu negocio está configurado. Puedes actualizar los datos cuando lo necesites.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de tu empresa que aparecerá en los tickets y documentos.
          </p>
        </div>

        {/* Mensajes de Feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-8">
          {/* Sección 1: Datos de Identidad (Editables) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Datos de Identidad del Negocio</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Actualiza la información que aparecerá en los tickets y documentos.
              </p>
            </CardHeader>
            <CardContent>
              <form id="empresa-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre de la Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="BeautyPro"
                      required
                    />
                  </div>

                  {/* NIT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIT / Cédula
                    </label>
                    <input
                      type="text"
                      name="nit"
                      value={formData.nit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="900-123-456-7"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(601) 234-5678"
                      />
                    </div>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Quibdó"
                    />
                  </div>
                </div>

                {/* Dirección (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Calle Principal #123"
                    />
                  </div>
                </div>

                {/* Mensaje del Ticket (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje para Ticket
                  </label>
                  <div className="relative">
                    <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="mensaje_ticket"
                      value={formData.mensaje_ticket}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="¡Gracias por su compra!&#10;No se aceptan devoluciones después de 24h"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje aparecerá en el pie del ticket de venta.
                  </p>
                </div>

                {/* Logo (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la Empresa (Opcional)
                  </label>
                  <div className="space-y-4">
                    {/* Input de archivo */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleLogoChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {logoError && (
                          <p className="text-red-500 text-sm mt-1">{logoError}</p>
                        )}
                      </div>
                      
                      {/* Botón eliminar logo */}
                      {logoPreview && (
                        <Button
                          variant="outline"
                          onClick={handleEliminarLogo}
                          className="px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Eliminar Logo
                        </Button>
                      )}
                    </div>
                    
                    {/* Previsualización del logo */}
                    {logoPreview && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Logo cargado correctamente</p>
                          <p className="text-xs">Formato: {logoFile?.type}</p>
                          <p className="text-xs">Tamaño: {logoFile ? (logoFile.size / 1024).toFixed(1) : '0'} KB</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-blue-500">**</span>
                      <span>Formatos permitidos: JPG, PNG, WebP. Tamaño máximo: 500 KB</span>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sección 2: Estado de Suscripción (SOLO LECTURA) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCardIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Estado de Suscripción</h2>
                <LockClosedIcon className="w-5 h-5 text-gray-400" title="Solo lectura" />
              </div>
              <p className="text-gray-600 text-sm">
                Información de tu suscripción. Para cambios contacta a soporte.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Actual
                  </label>
                  <div className="relative">
                    <CreditCardIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="Plan Profesional"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="01/01/2024"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Fecha de Vencimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value="31/12/2024"
                      disabled
                      readOnly
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Los datos de suscripción son de solo lectura. Para cambiar tu plan o renovar, 
                    contacta a nuestro equipo de soporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => cargarEmpresa()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="empresa-form"
              variant="primary"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Actualizar Configuración
                </>
              )}
            </Button>
          </div>
        </div>

       <br />
        {/* Sección de Seguridad y Datos */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 border-b-0">
            <div className="flex items-center gap-3">
              <LockClosedIcon className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Seguridad y Datos</h2>
            </div>
            <p className="text-amber-100 text-sm mt-1">
              Gestiona los respaldos de tu información y descarga tus datos cuando lo necesites.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative group">
                <Button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Genera una copia completa de todas tus tablas en la nube"
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
                  💾 Activa el "Recolector" que escanea las 30 tablas y guarda una copia exacta en la nube
                </div>
              </div>

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
                  📁 Sube un archivo JSON externo y restaura usando el mismo sistema de integridad referencial
                </div>
              </div>
              
              <div className="relative group">
                <Button
                  variant="outline"
                  onClick={cargarBackups}
                  disabled={loadingBackups}
                  className="border-amber-600 text-amber-600 hover:bg-amber-50 font-medium py-3 px-6 transition-colors disabled:opacity-50"
                  title="Refresca la tabla del historial consultando nuevamente a Supabase"
                >
                  {loadingBackups ? (
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

            {/* Selector de frecuencia de respaldo automático */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Programar respaldo automático
              </label>
              <select
                value={frecuenciaRespaldo}
                onChange={(e) => handleGuardarFrecuencia(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Desactivado">Desactivado</option>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>

            {/* Nota informativa sobre almacenamiento */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                💡 Nota: El sistema mantendrá únicamente la copia de seguridad más reciente para optimizar el almacenamiento.
              </p>
            </div>

            
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
                  Todos tus respaldos guardados en la nube
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
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <CloudArrowDownIcon className="w-8 h-8 text-gray-400" />
                            <span>No hay respaldos guardados aún</span>
                            <span className="text-sm text-gray-400">
                              Crea tu primer respaldo para proteger tus datos
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      backups.map((backup) => (
                        <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(backup.created_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                            {backup.nombre_archivo}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800`}>
                              Manual
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex gap-2 justify-end">
                              <div className="relative group">
                                <Button
                                  onClick={() => handleDownloadBackup(backup)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
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
                                  onClick={() => handleDeleteBackup(backup)}
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
                              <div className="relative group">
                                <Button
                                  onClick={() => handleRestoreFromCloud(backup)}
                                  disabled={restoringBackup}
                                  className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
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
      
      {/* Modal de Confirmación de Eliminación */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <TrashIcon className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmar Eliminación
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el respaldo "<span className="font-medium text-gray-800">{deleteModal.backup?.nombre_archivo}</span>"?
            </p>
            
            <p className="text-gray-500 text-sm mb-6">
              Esta acción no se puede deshacer. El respaldo será eliminado permanentemente.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={cancelDeleteBackup}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteBackup}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Restauración desde la Nube */}
      {restoreModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmar Restauración
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de restaurar este respaldo "<span className="font-medium text-gray-800">{restoreModal.backup?.nombre_archivo}</span>"?
            </p>

            <p className="text-gray-500 text-sm mb-6">
              Se sobrescribirán todos los datos actuales del salón con la información guardada el día {new Date(restoreModal.backup?.created_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={cancelRestoreFromCloud}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmRestoreFromCloud}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Restaurar
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
              Se sobrescribirán todos los datos actuales del salón con la información de este archivo externo. Esta acción no se puede deshacer.
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
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-600 border border-green-700' 
            : 'bg-red-600 border border-red-700'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-white mr-2" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-white mr-2" />
            )}
            <span className="text-white text-sm font-medium">
              {toast.message}
            </span>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}
