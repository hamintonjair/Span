'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/toast';
import { registrarLog } from '@/lib/audit';
import {
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Comprobante {
  id: string;
  empresa_id: string;
  suscripcion_id?: string;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
  estado: 'aprobado' | 'rechazado' | 'pendiente';
  verificado: boolean;
  notas?: string;
  fecha_envio: string;
  fecha_verificacion?: string;
  verificado_por?: string;
  creado_en: string;
  actualizado_en: string;
  monto?: number;
}

interface Empresa {
  id: string;
  fecha_vencimiento?: string;
  plan_id: string;
}

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
}

interface ConfiguracionGlobal {
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  titular: string;
}

interface AdminGlobal {
  correo: string;
}

export default function FinanzasEmpresaPage() {
  const { user } = useJWTAuth();
  const supabase = createClient();
  // ✅ Verificación: useToast está correctamente inicializado
  const { showToast } = useToast();
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados para datos de configuración global y admin global
  const [configGlobal, setConfigGlobal] = useState<ConfiguracionGlobal | null>(null);
  const [adminGlobal, setAdminGlobal] = useState<AdminGlobal | null>(null);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pagos, setPagos] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [planActual, setPlanActual] = useState<Plan | null>(null);
  
  // Estados para el modal de comprobante
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);

  // Función para calcular el estado de la suscripción
  const getEstadoSuscripcion = () => {
    if (!empresa?.fecha_vencimiento) {
      return {
        estado: 'desconocido',
        diasRestantes: 0,
        mensaje: 'No hay fecha de vencimiento'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual
    
    const vencimientoDate = new Date(empresa.fecha_vencimiento);
    vencimientoDate.setHours(0, 0, 0, 0); // Inicio del día de vencimiento
    
    const diffTime = vencimientoDate.getTime() - today.getTime();
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let estado: 'vencido' | 'por-vencer' | 'al-dia';
    let mensaje = '';
    
    if (diasRestantes < 0) {
      estado = 'vencido';
      mensaje = `Vencido hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) === 1 ? '' : 's'}`;
    } else if (diasRestantes <= 3) {
      estado = 'por-vencer';
      mensaje = `Vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`;
    } else {
      estado = 'al-dia';
      mensaje = `Vence en ${diasRestantes} días`;
    }
    
    return {
      estado,
      diasRestantes,
      mensaje
    };
  };

  // Función para calcular el mes de pago basado en fecha_vencimiento
  const calcularMesPago = (fechaVencimiento: string): string => {
    const fecha = new Date(fechaVencimiento);
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const nombreMes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    
    return `${nombreMes} ${año}`;
  };

  useEffect(() => {
    if (user?.empresa_id) {
      loadEmpresa();
      loadPagos();
      loadConfiguracionGlobal();
      loadAdminGlobal();
    }
  }, [user, currentPage, filtroEstado, fechaInicio, fechaFin]);

  const loadEmpresa = async () => {
    try {
      // ✅ Cargar datos de la empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id, fecha_vencimiento, plan_id')
        .eq('id', user?.empresa_id)
        .single();

      if (empresaError) throw empresaError;
      setEmpresa(empresaData);
      
      // ✅ Cargar datos del plan para obtener el precio
      if (empresaData?.plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('planes')
          .select('id, nombre, precio, descripcion')
          .eq('id', empresaData.plan_id)
          .single();
          
        if (planError) {
          console.warn('No se pudo cargar el plan:', planError);
        } else {
          setPlanActual(planData);
        }
      }
      
      // ✅ Automatizar selección del mes basado en fecha_vencimiento
      if (empresaData?.fecha_vencimiento) {
        const mesCalculado = calcularMesPago(empresaData.fecha_vencimiento);
        setSelectedMonth(mesCalculado);
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
    }
  };

  const loadPagos = async () => {
    try {
      setLoading(true);
      
      if (!user?.empresa_id) {
        console.error('No hay empresa_id disponible');
        return;
      }
      
      // Construir query con filtros - usando tabla comprobantes como el Admin Global
      let query = createClient()
        .from('comprobantes')
        .select(`
          id,
          empresa_id,
          suscripcion_id,
          nombre_archivo,
          url_archivo,
          tipo_archivo,
          tamano_bytes,
          estado,
          verificado,
          notas,
          fecha_envio,
          fecha_verificacion,
          verificado_por,
          creado_en,
          actualizado_en,
          monto
        `, { count: 'exact' })
        .eq('empresa_id', user.empresa_id) // ✅ Seguridad: solo comprobantes de esta empresa
        .order('creado_en', { ascending: false });
      
      // Aplicar filtro de estado
      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }
      
      // Aplicar filtro de fechas
      if (fechaInicio) {
        query = query.gte('creado_en', new Date(fechaInicio).toISOString());
      }
      
      if (fechaFin) {
        query = query.lte('creado_en', new Date(fechaFin + 'T23:59:59').toISOString());
      }
      
      // Paginación
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // ✅ Actualizar montos de comprobantes existentes que no tienen precio
      if (data && planActual?.precio) {
        const comprobantesSinMonto = data.filter(comp => !comp.monto || comp.monto === 0);
        if (comprobantesSinMonto.length > 0) {
          
          for (const comprobante of comprobantesSinMonto) {
            await supabase
              .from('comprobantes')
              .update({ monto: planActual.precio })
              .eq('id', comprobante.id);
          }
          
          // Recargar datos para mostrar montos actualizados
          const { data: updatedData } = await query;
          setPagos(updatedData || []);
        } else {
          setPagos(data || []);
        }
      } else {
        setPagos(data || []);
      }
      
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error cargando comprobantes:', error);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguracionGlobal = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_global')
        .select('banco, tipo_cuenta, numero_cuenta, titular')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando configuración global:', error);
        return;
      }

      if (data) {
        setConfigGlobal(data);
      }
    } catch (error) {
      console.error('Error en loadConfiguracionGlobal:', error);
    }
  };

  const loadAdminGlobal = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('email')
        .eq('rol', 'admin_global')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando admin global:', error);
        return;
      }

      if (data) {
        setAdminGlobal({ correo: data.email });
      }
    } catch (error) {
      console.error('Error en loadAdminGlobal:', error);
    }
  };

  const canUploadComprobante = () => {
    if (!empresa?.fecha_vencimiento) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const vencimientoDate = new Date(empresa.fecha_vencimiento);
    vencimientoDate.setHours(0, 0, 0, 0);
    
    const diffTime = vencimientoDate.getTime() - today.getTime();
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Habilitar si faltan 2 días o menos, o si ya está vencido
    return diasRestantes <= 2 || diasRestantes < 0;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !selectedMonth) {
      showToast('Por favor selecciona un archivo y espera a que se calcule el mes de pago', 'warning');
      return;
    }

    try {
      setUploading(true);
      
      // ✅ Validar que selectedMonth tenga el valor calculado automáticamente
      if (!empresa?.fecha_vencimiento) {
        showToast('No se puede determinar el mes de pago sin fecha de vencimiento', 'error');
        return;
      }
      
      // Validar que el mes sea el correcto basado en la fecha de vencimiento
      const mesEsperado = calcularMesPago(empresa.fecha_vencimiento);
      if (selectedMonth !== mesEsperado) {
        showToast('Error en el cálculo del mes de pago. Por favor recarga la página.', 'error');
        return;
      }

      // Subir archivo a Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      // ✅ Sanitización de archivo: nombre único con timestamp para evitar caracteres especiales
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user?.empresa_id}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(fileName);

      // Insertar registro en tabla comprobantes (SOLO campos existentes en la BD)
      
      const { data: insertData, error: insertError } = await supabase
        .from('comprobantes')
        .insert({
          empresa_id: user?.empresa_id,
          nombre_archivo: selectedFile.name,
          url_archivo: publicUrl,
          tipo_archivo: selectedFile.type,
          tamano_bytes: selectedFile.size,
          estado: 'pendiente', // ✅ Campo correcto: 'estado'
          monto: planActual?.precio || 0 // ✅ Usar precio del plan actual desde la tabla planes
          // ❌ Eliminados: metodo_pago, mes_pago, estado_pago, verificado, fecha_envio, creado_en, actualizado_en (no existen)
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      
      // Registrar log de auditoría
      await registrarLog(createClient(), {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'REGISTRAR_GASTO',
        modulo: 'FINANZAS',
        detalles: {
          comprobante_id: insertData?.id,
          nombre_archivo: selectedFile.name,
          monto: planActual?.precio || 0,
          mes_pago: selectedMonth,
          concepto: 'Pago de suscripción',
          categoria: 'comprobante_pago',
          registrado_por: user?.id,
          fecha_registro: new Date().toISOString()
        }
      });
      
      // ✅ Limpiar estados del formulario
      setSelectedFile(null);
      setSelectedMonth(''); // Limpiar mes seleccionado
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // ✅ Refrescar lista de pagos automáticamente
      await loadPagos();
      
      showToast('Comprobante enviado con éxito. Está a la espera de ser revisado por nuestro equipo.', 'success');
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      showToast('Error al subir comprobante', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Funciones para el modal de comprobante
  const openComprobanteModal = (comprobante: Comprobante) => {
    setSelectedComprobante(comprobante);
    setShowComprobanteModal(true);
  };

  const closeComprobanteModal = () => {
    setShowComprobanteModal(false);
    setSelectedComprobante(null);
    // ✅ Refrescar datos al cerrar el modal para mostrar montos actualizados
    loadPagos();
  };

  // Funciones auxiliares para formato
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearMonto = (monto?: number) => {
    // ✅ Si no hay monto o es 0, mostrar mensaje indicativo
    if (!monto || monto === 0) return '$0.00';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(monto);
  };

  const getUploadMessage = () => {
    if (!empresa?.fecha_vencimiento) return '';
    
    const estado = getEstadoSuscripcion();
    
    if (estado.estado === 'vencido') {
      return '⚠️ Tu suscripción está vencida. Sube tu comprobante para reactivarla.';
    }
    
    if (estado.estado === 'por-vencer') {
      return `⏰ Tu plan vence pronto. ${estado.mensaje}`;
    }
    
    const vencimientoDate = new Date(empresa.fecha_vencimiento);
    const daysUntilVencimiento = Math.ceil((vencimientoDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilVencimiento > 2) {
      return `📅 El botón se habilitará automáticamente en ${daysUntilVencimiento - 2} día${daysUntilVencimiento - 2 === 1 ? '' : 's'}.`;
    }
    
    return '';
  };

  if (!user?.empresa_id) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>No tienes acceso a esta página.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finanzas</h1>
          <p className="text-gray-600">Gestiona tus pagos y comprobantes de suscripción</p>
        </div>

        {/* Mensaje de aviso */}
        {getUploadMessage() && (
          <div className={`mb-6 p-4 rounded-lg border ${
            getEstadoSuscripcion().estado === 'vencido' 
              ? 'bg-red-50 border-red-200' 
              : getEstadoSuscripcion().estado === 'por-vencer'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`${
              getEstadoSuscripcion().estado === 'vencido'
                ? 'text-red-800'
                : getEstadoSuscripcion().estado === 'por-vencer'
                ? 'text-amber-800'
                : 'text-blue-800'
            }`}>{getUploadMessage()}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subir Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5 text-blue-600" />
                Subir Comprobante de Pago
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Sube el comprobante de tu pago mensual para mantener tu suscripción activa
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes del pago
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                    {selectedMonth || 'Calculando mes de pago...'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Periodo calculado automáticamente según tu fecha de vencimiento
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante (PDF o imagen)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={uploading || !canUploadComprobante()}
                  className={`w-full ${
                    getEstadoSuscripcion().estado === 'vencido' || getEstadoSuscripcion().estado === 'por-vencer'
                      ? 'bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg animate-pulse ring-2 ring-red-300 ring-offset-2'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Estado Actual */}
          <Card className={`${
            getEstadoSuscripcion().estado === 'vencido' ? 'border-2 border-red-300 shadow-red-100' : ''
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getEstadoSuscripcion().estado === 'vencido' ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                ) : (
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                )}
                Estado de Suscripción
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Revisa el estado actual de tu suscripción y fecha de vencimiento
              </p>
            </CardHeader>
            <CardContent>
              {empresa ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getEstadoSuscripcion().estado === 'vencido'
                        ? 'bg-red-100 text-red-800 font-bold'
                        : getEstadoSuscripcion().estado === 'por-vencer'
                        ? 'bg-amber-100 text-amber-800 font-semibold'
                        : 'bg-green-100 text-green-800 font-medium'
                    }`}>
                      {getEstadoSuscripcion().estado === 'vencido'
                        ? 'VENCIDO'
                        : getEstadoSuscripcion().estado === 'por-vencer'
                        ? 'POR VENCER'
                        : 'ACTIVA'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Próximo vencimiento:</span>
                    <span className={`${
                      getEstadoSuscripcion().estado === 'vencido' ? 'font-bold text-red-600' : 'text-gray-900 font-medium'
                    }`}>
                      {empresa.fecha_vencimiento ? 
                        new Date(empresa.fecha_vencimiento).toLocaleDateString('es-ES') : 
                        'No disponible'
                      }
                    </span>
                  </div>
                  {getEstadoSuscripcion().estado === 'por-vencer' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 text-sm font-medium">
                        ⚠️ Tu plan vence pronto. {getEstadoSuscripcion().mensaje}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan actual:</span>
                    <span className="text-gray-900 font-medium">
                      {empresa.plan_id ? 'Plan Estándar' : 'No disponible'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-gray-600">Cargando información...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Datos de Pago - Cuenta del Super Admin */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
              Datos para Pago
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Realiza tus pagos a esta cuenta bancaria y contacta al administrador si tienes dudas
            </p>
          </CardHeader>
          <CardContent>
            {configGlobal && adminGlobal ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-2">Información Bancaria</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">Banco:</span>
                        <span className="text-sm text-gray-900">{configGlobal.banco}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">Tipo de Cuenta:</span>
                        <span className="text-sm text-gray-900">{configGlobal.tipo_cuenta}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">Número de Cuenta:</span>
                        <span className="text-sm font-mono text-gray-900">{configGlobal.numero_cuenta}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">Titular:</span>
                        <span className="text-sm text-gray-900">{configGlobal.titular}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-2">Contacto Administrador</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm font-medium text-gray-600">Correo de Contacto:</span>
                        <span className="text-sm text-blue-600">{adminGlobal.correo}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Importante:</strong> Cargar el comprobante de pago en esta misma vista en <strong>Subir comprobante de pago</strong> para ser revisado y activar tu suscripción. Si en alguún momento presenta INCONVENIENTES para el envio del comprobante, <strong>enviar un correo indicando los problemas presentados para poder darte una solución.</strong> 
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando datos de pago...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Pagos */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                <p className="text-sm text-gray-600">Revisa el historial completo de tus pagos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando historial...</p>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No hay pagos registrados</p>
              </div>
            ) : (
              <>
                {/* Filtros */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filtroEstado}
                        onChange={(e) => {
                          setFiltroEstado(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="todos">Todos</option>
                        <option value="aprobado">Aprobados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="rechazado">Rechazados</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={fechaInicio}
                        onChange={(e) => {
                          setFechaInicio(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={fechaFin}
                        onChange={(e) => {
                          setFechaFin(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFiltroEstado('todos');
                          setFechaInicio('');
                          setFechaFin('');
                          setCurrentPage(1);
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagos.map((comprobante) => (
                        <tr key={comprobante.id} className={comprobante.estado === 'rechazado' ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatearFecha(comprobante.actualizado_en || comprobante.fecha_envio)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {comprobante.estado === 'aprobado' ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <CheckCircleIcon className="w-3 h-3" />
                                Aprobado
                              </span>
                            ) : comprobante.estado === 'pendiente' ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                <ClockIcon className="w-3 h-3" />
                                Pendiente
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <XCircleIcon className="w-3 h-3" />
                                Rechazado
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <CurrencyDollarIcon className="w-4 h-4 text-green-600 mr-1" />
                              {formatearMonto(comprobante.monto)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openComprobanteModal(comprobante)}
                                disabled={!comprobante.url_archivo}
                              >
                                Ver
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para ver comprobante */}
      {showComprobanteModal && selectedComprobante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Comprobante de Pago
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeComprobanteModal}
              >
                <XCircleIcon className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-50/50 rounded-lg p-6 border border-green-100">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Detalles del Pago</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                    <div className="flex items-center text-lg font-semibold text-green-600 bg-white px-3 py-2 rounded border border-green-200">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      {formatearMonto(selectedComprobante.monto)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <p className="text-base text-gray-900 bg-white px-3 py-2 rounded border border-green-200">Pago de Suscripción</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del archivo</label>
                    <p className="text-base text-gray-900 bg-white px-3 py-2 rounded border border-green-200">{selectedComprobante?.nombre_archivo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <div className="flex items-center">
                      {selectedComprobante.estado === 'aprobado' ? (
                        <span className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <CheckCircleIcon className="w-4 h-4" />
                          Aprobado
                        </span>
                      ) : selectedComprobante.estado === 'pendiente' ? (
                        <span className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          <ClockIcon className="w-4 h-4" />
                          Pendiente
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          <XCircleIcon className="w-4 h-4" />
                          Rechazado
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de envío</label>
                    <p className="text-base text-gray-900 bg-white px-3 py-2 rounded border border-green-200">{formatearFecha(selectedComprobante.fecha_envio)}</p>
                  </div>
                  {selectedComprobante.fecha_verificacion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de verificación</label>
                      <p className="text-base text-gray-900 bg-white px-3 py-2 rounded border border-green-200">{formatearFecha(selectedComprobante.fecha_verificacion)}</p>
                    </div>
                  )}
                  {selectedComprobante.verificado_por && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verificado por</label>
                      <p className="text-base text-gray-900 bg-white px-3 py-2 rounded border border-green-200">{selectedComprobante.verificado_por}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedComprobante.estado === 'rechazado' && selectedComprobante.notas && (
                <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-300">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="text-lg font-medium text-orange-900">Notas de Rechazo</h4>
                  </div>
                  <p className="text-base text-orange-900 bg-white px-4 py-3 rounded border border-orange-200 leading-relaxed">{selectedComprobante.notas}</p>
                </div>
              )}
              
              {selectedComprobante.estado !== 'rechazado' && selectedComprobante.notas && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-blue-900">Notas del Administrador</h4>
                  </div>
                  <p className="text-base text-blue-900 bg-white px-4 py-3 rounded border border-blue-200 leading-relaxed">{selectedComprobante.notas}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Comprobante</label>
                <div className="flex justify-center items-center">
                  <div className="border rounded-lg overflow-hidden shadow-lg">
                    {selectedComprobante.url_archivo ? (
                      selectedComprobante.tipo_archivo?.startsWith('image/') ? (
                        <img
                          src={selectedComprobante.url_archivo}
                          alt="Comprobante de pago"
                          className="max-h-[500px] w-auto object-contain"
                        />
                      ) : (
                        <iframe
                          src={selectedComprobante.url_archivo}
                          className="w-full h-[500px]"
                          title="Comprobante de pago"
                        />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-96 bg-gray-50">
                        <p className="text-gray-500">No hay comprobante disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                {selectedComprobante.url_archivo && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedComprobante.url_archivo, '_blank')}
                  >
                    Abrir en nueva pestaña
                  </Button>
                )}
                <Button onClick={closeComprobanteModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
