'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase-client';
import { registrarLog } from '@/lib/audit';
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  Users, 
  Mail, 
  Cake, 
  Bell,
  CheckCircle,
  Clock,
  Target,
  ChevronLeftIcon,
  ChevronRightIcon,
  Eye
} from 'lucide-react';

export default function MarketingPage() {
  const { planName } = usePlanPermissions();
  const { user } = useJWTAuth();
  const supabase = createClient();
  
  // Estados para los switches de automatizaciones
  const [automations, setAutomations] = useState({
    recordatorioCita: true,
    felicitacionCumpleanos: true,
    reactivacionClientes: false
  });

  // Estados para el formulario de campaña
  const [campaignForm, setCampaignForm] = useState({
    audiencia: 'todos',
    asunto: '',
    mensaje: ''
  });

  // Estados para campañas reales
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Estados para el modal de ejecución
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sentToClients, setSentToClients] = useState<Set<string>>(new Set());
  const [nombreEmpresa, setNombreEmpresa] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Paginación para campañas
  const [itemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar campañas desde la base de datos
  const loadCampaigns = async () => {
    if (!user?.empresa_id) return;
    
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('campanas_marketing')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      setTotalCount(count || 0);
      setItemOffset(0); // Resetear a primera página al cargar
    } catch (error) {
      console.error('Error al cargar campañas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de la empresa
  const loadEmpresaData = async () => {
    if (!user?.empresa_id) return;
    
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('nombre')
        .eq('id', user.empresa_id)
        .single();
      
      if (error) throw error;
      if (data) {
        setNombreEmpresa(data.nombre);
      }
    } catch (error) {
      console.error('Error al cargar datos de la empresa:', error);
    }
  };

  // Enviar nueva campaña (solo validar y abrir modal)
  const sendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.empresa_id || !campaignForm.asunto.trim() || !campaignForm.mensaje.trim()) {
      return;
    }

    try {
      setSending(true);
      
      // Resetear ID de campaña (nueva campaña sin guardar)
      setCampaignId(null);
      
      // Preparar datos de campaña para el modal (sin guardar en DB)
      const campaignData = {
        empresa_id: user.empresa_id,
        nombre: campaignForm.asunto,
        mensaje: campaignForm.mensaje,
        audiencia: campaignForm.audiencia,
        estado: 'pendiente'
      };
      
      setCurrentCampaign(campaignData);
      setShowExecutionModal(true);
      
      // Limpiar formulario
      setCampaignForm({
        audiencia: 'todos',
        asunto: '',
        mensaje: ''
      });
    } catch (error) {
      console.error('Error al preparar campaña:', error);
    } finally {
      setSending(false);
    }
  };

  // Calcular página actual basado en offset
  useEffect(() => {
    setCurrentPage(Math.floor(itemOffset / itemsPerPage) + 1);
  }, [itemOffset, itemsPerPage]);

  // Cargar campañas, datos de empresa y KPIs al montar el componente
  useEffect(() => {
    if (user?.empresa_id) {
      loadCampaigns();
      loadEmpresaData();
      loadKPIs();
    }
  }, [user?.empresa_id]);

  // Datos para mostrar en tabla de campañas
  const endOffset = itemOffset + itemsPerPage - 1;
  const currentCampaigns = campaigns.slice(itemOffset, endOffset + 1);
  const pageCount = Math.ceil(totalCount / itemsPerPage);

  // Ejecutar campaña predefinida
  const executePredefinedCampaign = (type: string) => {
    const predefinedMessages = {
      recordatorio: {
        audiencia: 'recordatorios',
        mensaje: 'Te recordamos que tienes una cita programada con nosotros el {{fecha}} a las {{hora}}. \n\n¡Te esperamos!'
      },
      cumpleañeros_hoy: {
        audiencia: 'cumpleañeros_hoy',
        mensaje: 'Queremos desearte un feliz cumpleaños. \n\nHoy celebramos contigo este día tan especial para tí, y como obsequio, tienes un 10% de descuento el día de hoy en uno de nuestros servicios.\n\nEsperamos seguir acompañándote y brindarte la mejor experiencia.'
      },
      inactivos: {
        audiencia: 'inactivos',
        mensaje: '¡Hola {{cliente}}! Hace tiempo que no nos visitas y te extrañamos. {{empresa}}! Vuelve a agendar y recibe un tratamiento de hidratación gratis.'
      }
    };

    const campaign = predefinedMessages[type as keyof typeof predefinedMessages];
    if (!campaign) return;

    // Abrir modal con la campaña predefinida
    setCurrentCampaign({
      empresa_id: user?.empresa_id,
      nombre: type === 'recordatorio' ? 'Recordatorio de Cita' :
               type === 'cumpleañeros_hoy' ? 'Felicitación de Cumpleaños' :
               'Reactivación de Clientes',
      mensaje: campaign.mensaje,
      audiencia: campaign.audiencia,
      estado: 'enviada'
    });
    setShowExecutionModal(true);
  };

  // Cargar destinatarios según audiencia
  const loadRecipients = async (audiencia: string) => {
    if (!user?.empresa_id) return;
    
    try {
      setLoadingRecipients(true);
      let query = supabase
        .from('clientes')
        .select('id, nombre, telefono, fecha_nacimiento, es_vip')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      // Filtros específicos para audiencias predefinidas
      if (audiencia === 'vip') {
        query = query.eq('es_vip', true);
        const { data, error } = await query;
        if (error) throw error;
        let finalRecipients = data || [];
        setRecipients(finalRecipients);
        return;
      }

      // 1. RECORDATORIOS (Citas futuras - para enviar en cualquier momento)
      if (audiencia === 'recordatorios') {
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];

        const { data: citasFuturas, error: errorCitas } = await supabase
          .from('citas')
          .select('cliente_id, clientes(id, nombre, telefono), fecha')
          .eq('empresa_id', user.empresa_id)
          .gte('fecha', fechaHoy) // Mayor o igual que hoy (citas de hoy en adelante)
          .order('fecha', { ascending: true }); // Ordenar por fecha ascendente

        if (errorCitas) throw errorCitas;

        // Extraer clientes de las citas sin duplicados (por si un cliente tiene 2 servicios)
        const clientesUnicos = new Map();
        citasFuturas?.forEach((cita: any) => {
          if (cita.clientes) {
            // Extraer hora del timestamp de fecha
            const fechaObj = new Date(cita.fecha);
            const horaFormateada = fechaObj.toLocaleTimeString('es', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
            
            // Incluir información de la cita en el objeto del cliente
            const clienteConCita = {
              ...cita.clientes,
              fecha_cita: cita.fecha,
              hora_cita: horaFormateada
            };
            clientesUnicos.set(cita.clientes.id, clienteConCita);
          }
        });
        const finalRecipients = Array.from(clientesUnicos.values());
        setRecipients(finalRecipients);
        return;
      }

      // 2. CUMPLEAÑEROS DE HOY
      else if (audiencia === 'cumpleañeros_hoy') {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        
        // Aquí filtramos el array base que ya trajimos al inicio de loadRecipients
        const { data, error } = await query;
        if (error) throw error;
        let finalRecipients = data || [];
        
        finalRecipients = finalRecipients.filter(cliente => {
          if (!cliente.fecha_nacimiento) return false;
          const dateParts = cliente.fecha_nacimiento.split('-');
          // Supabase guarda las fechas como YYYY-MM-DD
          const clientMonth = parseInt(dateParts[1], 10);
          const clientDay = parseInt(dateParts[2], 10);
          return clientDay === currentDay && clientMonth === currentMonth;
        });
        setRecipients(finalRecipients);
        return;
      }

      // 3. REACTIVACIÓN DE INACTIVOS (Sin citas en los últimos 60 días)
      else if (audiencia === 'inactivos') {
        const hace60Dias = new Date();
        hace60Dias.setDate(hace60Dias.getDate() - 60);
        const fechaLimite = hace60Dias.toISOString().split('T')[0];

        // Traer todas las citas de los últimos 60 días
        const { data: citasRecientes } = await supabase
          .from('citas')
          .select('cliente_id')
          .eq('empresa_id', user.empresa_id)
          .gte('fecha', fechaLimite);

        // Crear un Set con los IDs de clientes que SÍ han venido recientemente
        const clientesRecientes = new Set(citasRecientes?.map(c => c.cliente_id) || []);

        // Dejar solo los clientes que NO están en ese Set (los inactivos)
        const { data, error } = await query;
        if (error) throw error;
        let finalRecipients = data || [];
        
        finalRecipients = finalRecipients.filter(cliente => !clientesRecientes.has(cliente.id));
        setRecipients(finalRecipients);
        return;
      }

      // 4. CUMPLEAÑEROS DEL MES (lógica existente)
      else if (audiencia === 'cumpleañeros') {
        const currentMonth = new Date().getMonth() + 1; // getMonth() es 0-11
        const { data, error } = await query;
        if (error) throw error;
        
        let finalRecipients = data || [];
        finalRecipients = finalRecipients.filter(cliente => {
          if (!cliente.fecha_nacimiento) return false;
          // La fecha viene en formato YYYY-MM-DD
          const monthString = cliente.fecha_nacimiento.split('-')[1];
          const clientMonth = parseInt(monthString, 10);
          return clientMonth === currentMonth;
        });
        setRecipients(finalRecipients);
        return;
      }

      // 5. TODOS LOS CLIENTES (audiencia por defecto)
      else {
        const { data, error } = await query;
        if (error) throw error;
        let finalRecipients = data || [];
        setRecipients(finalRecipients);
        return;
      }
    } catch (error) {
      console.error('Error al cargar destinatarios:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Limpiar número de teléfono para WhatsApp
  const cleanPhoneNumber = (phone: string): string => {
    // Eliminar espacios, paréntesis, guiones y otros caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Asegurar que comience con 57 para Colombia
    if (!cleaned.startsWith('57')) {
      cleaned = '57' + cleaned;
    }
    
    return cleaned;
  };

  // Guardar campaña en base de datos (solo en primer clic de WhatsApp)
  const saveCampaignToDB = async () => {
    if (!campaignId && currentCampaign && user?.empresa_id) {
      try {
        // Verificar si la audiencia es válida para la base de datos
        const audienciasValidas = ['todos', 'vip', 'cumpleañeros'];
        
        if (!audienciasValidas.includes(currentCampaign.audiencia)) {
          // No guardar campañas predefinidas con audiencias no válidas
          return;
        }
        
        const campaignData = {
          empresa_id: user.empresa_id,
          nombre: currentCampaign.nombre,
          mensaje: currentCampaign.mensaje,
          audiencia: currentCampaign.audiencia,
          estado: 'enviada'
        };

        const { data, error } = await supabase
          .from('campanas_marketing')
          .insert([campaignData])
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          // Registrar log de auditoría
          await registrarLog(supabase, {
            empresa_id: user?.empresa_id || undefined,
            usuario_id: user?.id,
            accion: 'CREAR_CAMPANA',
            modulo: 'MARKETING',
            detalles: {
              campana_id: data[0].id,
              nombre: campaignData.nombre,
              mensaje: campaignData.mensaje,
              audiencia: campaignData.audiencia,
              estado: campaignData.estado,
              creado_por: user?.id,
              fecha_creacion: new Date().toISOString()
            }
          });
          
          setCampaignId(data[0].id);
          setCurrentCampaign(data[0]);
          await loadCampaigns();
        }
      } catch (error) {
        console.error('Error al guardar campaña:', error);
      }
    }
  };

  // Enviar mensaje a WhatsApp
  const sendWhatsAppMessage = async (cliente: any, mensaje: string) => {
    // Guardar campaña en base de datos si es el primer clic
    await saveCampaignToDB();
    
    // Reemplazar variables dinámicas y añadir prefijo profesional
    let mensajeConVariables = mensaje
      .replace(/{{cliente}}/g, cliente.nombre)
      .replace(/{{empresa}}/g, nombreEmpresa);
    
    // Reemplazar variables de fecha y hora si el cliente tiene cita
    if (cliente.fecha_cita) {
      // Verificar si la cita es hoy
      const fechaCita = new Date(cliente.fecha_cita);
      const hoy = new Date();
      
      // Comparar solo día, mes y año (ignorar hora)
      const esHoy = fechaCita.getDate() === hoy.getDate() &&
                   fechaCita.getMonth() === hoy.getMonth() &&
                   fechaCita.getFullYear() === hoy.getFullYear();
      
      let fechaFormateada;
      if (esHoy) {
        fechaFormateada = 'hoy';
      } else {
        // Formatear fecha a un formato más legible usando formato manual
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const nombreDia = dias[fechaCita.getDay()];
        const dia = fechaCita.getDate();
        const nombreMes = meses[fechaCita.getMonth()];
        
        fechaFormateada = `${nombreDia} ${dia} de ${nombreMes}`;
      }
      
      mensajeConVariables = mensajeConVariables.replace(/{{fecha}}/g, fechaFormateada);
    }
    
    if (cliente.hora_cita) {
      mensajeConVariables = mensajeConVariables.replace(/{{hora}}/g, cliente.hora_cita);
    }
    
    // Formatear mensaje final con Template Literals y saltos de línea dobles
    const mensajeFormateado = ` ¡Hola ${cliente.nombre}!

Me comunico de *${nombreEmpresa}*. Actualmente eres uno de nuestros clientes más especiales y queremos comentarte lo siguiente:

${mensajeConVariables}`;
    
    const cleanedPhone = cleanPhoneNumber(cliente.telefono);
    const encodedMessage = encodeURIComponent(mensajeFormateado);
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    // Marcar como enviado
    setSentToClients(prev => new Set(prev).add(cliente.id));
  };

  // Cargar destinatarios cuando se abre el modal
  useEffect(() => {
    if (showExecutionModal && currentCampaign) {
      loadRecipients(currentCampaign.audiencia);
    }
  }, [showExecutionModal, currentCampaign]);

  // Marcar campaña como leída
  const marcarComoLeida = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campanas_marketing')
        .update({ estado: 'leida' })
        .eq('id', campaignId);

      if (error) throw error;

      // Registrar log de auditoría
      await registrarLog(supabase, {
        empresa_id: user?.empresa_id || undefined,
        usuario_id: user?.id,
        accion: 'ACTUALIZAR_CAMPANA',
        modulo: 'MARKETING',
        detalles: {
          campana_id: campaignId,
          cambio_estado: true,
          estado_anterior: 'enviada',
          estado_nuevo: 'leida',
          actualizado_por: user?.id,
          fecha_actualizacion: new Date().toISOString()
        }
      });

      // Recargar campañas y KPIs
      await loadCampaigns();
      await loadKPIs();
    } catch (error) {
      console.error('Error al marcar campaña como leída:', error);
    }
  };

  // Estado para KPIs
  const [kpis, setKpis] = useState({
    clientesActivos: 0,
    campanasEnviadas: 0,
    tasaApertura: 0
  });

  // Cargar KPIs desde la base de datos
  const loadKPIs = async () => {
    if (!user?.empresa_id) return;

    try {
      // 1. Clientes Activos
      const { data: clientesActivos, error: errorClientes } = await supabase
        .from('clientes')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'activo');

      if (errorClientes) throw errorClientes;

      // 2. Campañas Enviadas este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const fechaInicioMes = inicioMes.toISOString();

      const { data: campanasMes, error: errorCampanas } = await supabase
        .from('campanas_marketing')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'enviada')
        .gte('created_at', fechaInicioMes);

      if (errorCampanas) throw errorCampanas;

      // 3. Tasa de Apertura - calcular campañas leídas sobre enviadas
      const { data: campanasLeidas, error: errorLeidas } = await supabase
        .from('campanas_marketing')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('estado', 'enviada') // Asumimos que existe estado 'leida'
        .gte('created_at', fechaInicioMes);

      if (errorLeidas) throw errorLeidas;

      const totalEnviadas = campanasMes?.length || 0;
      const totalLeidas = campanasLeidas?.length || 0;
      
      // Calcular tasa de apertura (leídas / enviadas * 100)
      const tasaApertura = totalEnviadas > 0 
        ? Math.round((totalLeidas / totalEnviadas) * 100) 
        : 0;

      setKpis({
        clientesActivos: clientesActivos?.length || 0,
        campanasEnviadas: totalEnviadas,
        tasaApertura: tasaApertura
      });

    } catch (error) {
      console.error('Error al cargar KPIs:', error);
    }
  };

  return (
    <MainLayout>
      <ProtectedRoute
        requiredPermission="marketing"
        moduleInfo={{
          name: 'Marketing',
          icon: '📢',
          benefits: [
            'Campañas de email marketing',
            'Gestiona redes sociales integradas',
            'Programa de lealtad para clientes',
            'Análisis de campañas en tiempo real',
            'Segmentación de clientes avanzada',
            'Automatización de marketing'
          ],
          requiredPlan: 'Premium',
          upgradePrice: 149.99
        }}
      >
        <div className="min-h-screen bg-amber-50 p-6">
          {/* Encabezado y KPIs Rápidos */}
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Marketing y Fidelización</h1>
            <p className="text-gray-600 mb-6">Gestiona campañas y automatiza la comunicación con tus clientes</p>
            
            {/* Fila de 3 Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-stone-900 border-stone-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Clientes Activos</p>
                      <p className="text-3xl font-bold text-black mt-2">{kpis.clientesActivos}</p>
                    </div>
                    <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                      <Users className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-900 border-amber-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Campañas Enviadas este mes</p>
                      <p className="text-3xl font-bold text-black mt-2">{kpis.campanasEnviadas}</p>
                    </div>
                    <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                      <Send className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-900 border-amber-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Tasa de Apertura</p>
                      <p className="text-3xl font-bold text-black mt-2">{kpis.tasaApertura}%</p>
                    </div>
                    <div className="flex-shrink-0 bg-amber-900 rounded-lg p-3">
                      <Target className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Panel Principal (2 Columnas en Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda: Automatizaciones y Recordatorios */}
            <div>
              <Card className="bg-stone-900 border-stone-300">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-black flex items-center">
                    <Target className="w-5 h-5 mr-2 text-amber-500" />
                    Tareas Diarias (Predefinidas)
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Recordatorio de Cita */}
                    <div className="flex items-center justify-between p-4 bg-stone-400 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-amber-500 mr-3" />
                        <div>
                          <p className="text-black font-medium">Recordatorio de Cita</p>
                          <p className="text-gray-100 text-sm">Citas futuras vía WhatsApp/Email</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executePredefinedCampaign('recordatorio')}
                        className="border-amber-600 text-amber-900 hover:bg-amber-600 hover:text-white"
                      >
                        Ejecutar Hoy
                      </Button>
                    </div>

                    {/* Felicitación de Cumpleaños */}
                    <div className="flex items-center justify-between p-4 bg-stone-400 rounded-lg">
                      <div className="flex items-center">
                        <Cake className="w-5 h-5 text-amber-500 mr-3" />
                        <div>
                          <p className="text-black font-medium">Felicitación de Cumpleaños</p>
                          <p className="text-gray-100 text-sm">Con descuento del 10% (Requiere que el cliente tenga fecha de nacimiento registrada)</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executePredefinedCampaign('cumpleañeros_hoy')}
                        className="border-amber-600 text-amber-900 hover:bg-amber-600 hover:text-white"
                      >
                        Ver Cumpleañeros Hoy
                      </Button>
                    </div>

                    {/* Reactivación de Clientes */}
                    <div className="flex items-center justify-between p-4 bg-stone-400 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-amber-500 mr-3" />
                        <div>
                          <p className="text-black font-medium">Reactivación de Clientes</p>
                          <p className="text-gray-100 text-sm">Clientes que no vienen hace 2 meses</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executePredefinedCampaign('inactivos')}
                        className="border-amber-600 text-amber-900 hover:bg-amber-600 hover:text-white"
                      >
                        Ver Pendientes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Crear Nueva Campaña Manual */}
            <div>
              <Card className="bg-stone-900 border-stone-300">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-black flex items-center">
                    <Send className="w-5 h-5 mr-2 text-amber-500" />
                    Crear Nueva Campaña Manual
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Selector de Audiencia */}
                    <div>
                      <label className="block text-black font-medium mb-2">Audiencia</label>
                      <select
                        value={campaignForm.audiencia}
                        onChange={(e) => setCampaignForm(prev => ({...prev, audiencia: e.target.value}))}
                        className="w-full p-3 bg-stone-400 border border-stone-600 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="todos">Todos los clientes</option>
                        <option value="vip">Clientes VIP</option>
                        <option value="cumpleañeros">Clientes de cumpleaños</option>
                      </select>
                    </div>

                    {/* Input para Asunto */}
                    <div>
                      <label className="block text-black font-medium mb-2">Asunto</label>
                      <Input
                        type="text"
                        value={campaignForm.asunto}
                        onChange={(e) => setCampaignForm(prev => ({...prev, asunto: e.target.value}))}
                        placeholder="Escribe el asunto del mensaje..."
                        className="w-full p-3 bg-stone-400 border border-stone-600 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Textarea para Cuerpo del mensaje */}
                    <div>
                      <label className="block text-black font-medium mb-2">Cuerpo del mensaje</label>
                      <textarea
                        value={campaignForm.mensaje}
                        onChange={(e) => setCampaignForm(prev => ({...prev, mensaje: e.target.value}))}
                        placeholder="Te ofrecemos 20% de descuento en tu próxima visita. ¡No te lo pierdas!"
                        rows={6}
                        className="w-full p-3 bg-stone-400 border border-stone-600 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                      <p className="text-gray-600 text-xs mt-2">
                        El sistema añadirá automáticamente un saludo profesional con tu nombre y el del cliente al principio del mensaje. Puedes usar asteriscos para negritas y guiones bajos para cursivas en WhatsApp.
                      </p>
                    </div>

                    {/* Botón de Enviar */}
                    <form onSubmit={sendCampaign}>
                      <Button 
                        type="submit"
                        disabled={sending}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 flex items-center justify-center"
                      >
                        <span className="mr-2">{'\ud83d\udcf1'}</span>
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Enviando...' : 'Enviar Campaña Ahora'}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Historial de Campañas */}
          <Card className="bg-stone-900 border-stone-300">
            <CardHeader>
              <h2 className="text-xl font-semibold text-black flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-500" />
                Historial de Campañas
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-stone-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre de Campaña</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha de Creación</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Audiencia</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-stone-300 hover:bg-amber-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-black">{campaign.nombre}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(campaign.created_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {campaign.audiencia === 'todos' ? 'Todos los clientes' : 
                           campaign.audiencia === 'vip' ? 'Clientes VIP' : 
                           campaign.audiencia === 'cumpleañeros' ? 'Clientes de cumpleaños' :
                           campaign.audiencia === 'recordatorios' ? 'Recordatorio de Citas' :
                           campaign.audiencia === 'cumpleañeros_hoy' ? 'Cumpleañeros de Hoy' :
                           campaign.audiencia === 'inactivos' ? 'Reactivación de Clientes' :
                           'Clientes de cumpleaños'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {campaign.estado === 'enviada' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Enviada
                            </span>
                          ) : campaign.estado === 'leida' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                              <Eye className="w-3 h-3 mr-1" />
                              Leída
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-700 text-stone-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {campaign.estado === 'enviada' && (
                            <button
                              onClick={() => marcarComoLeida(campaign.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Marcar leída
                            </button>
                          )}
                          {campaign.estado === 'leida' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-300 text-gray-600">
                              <Eye className="w-3 h-3 mr-1" />
                              Ya leída
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación de Campañas */}
              {pageCount > 0 && (
                <div className="flex items-center justify-between px-6 py-3 bg-stone-500 border-t border-stone-700">
                  <div className="text-sm text-gray-300">
                    Mostrando {itemOffset + 1} a {Math.min(endOffset + 1, totalCount)} de {totalCount} campañas
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setItemOffset(Math.max(0, itemOffset - itemsPerPage))}
                      disabled={itemOffset === 0}
                    >
                      <span className="w-4 h-4">‹</span>
                    </Button>
                    <span className="text-sm text-gray-300">
                      Página {currentPage} de {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setItemOffset(Math.min(itemOffset + itemsPerPage, totalCount - itemsPerPage))}
                      disabled={itemOffset + itemsPerPage >= totalCount}
                    >
                      <span className="w-4 h-4">›</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Ejecución de Campaña */}
        {showExecutionModal && currentCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2c1c14] border border-amber-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Ejecutar Campaña: {currentCampaign.nombre}
                </h2>
                <button
                  onClick={() => {
                    setShowExecutionModal(false);
                    setCurrentCampaign(null);
                    setRecipients([]);
                    setSentToClients(new Set());
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información de la Campaña */}
              <div className="mb-6 p-4 bg-stone-800 rounded-lg">
                <p className="text-gray-300 text-sm mb-2">
                  <span className="font-medium text-white">Audiencia:</span> {' '}
                  {currentCampaign.audiencia === 'todos' ? 'Todos los clientes' : 
                   currentCampaign.audiencia === 'vip' ? 'Clientes VIP' : 
                   currentCampaign.audiencia === 'cumpleañeros' ? 'Clientes de cumpleaños' :
                   currentCampaign.audiencia === 'recordatorios' ? 'Recordatorio de Citas' :
                   currentCampaign.audiencia === 'cumpleañeros_hoy' ? 'Cumpleañeros de Hoy' :
                   currentCampaign.audiencia === 'inactivos' ? 'Reactivación de Clientes' :
                   'Clientes de cumpleaños'}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium text-white">Mensaje:</span> {currentCampaign.mensaje}
                </p>
              </div>

              {/* Lista de Destinatarios */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Destinatarios ({recipients.length})
                </h3>
                
                {loadingRecipients ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Cargando destinatarios...</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {recipients.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">
                        No se encontraron destinatarios para esta audiencia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recipients.map((cliente) => (
                          <div 
                            key={cliente.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              sentToClients.has(cliente.id) 
                                ? 'bg-green-900 border-green-700' 
                                : 'bg-stone-800 border-stone-600'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-white font-medium">{cliente.nombre}</p>
                              <p className="text-gray-400 text-sm">{cliente.telefono}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {sentToClients.has(cliente.id) && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                              <button
                                onClick={() => sendWhatsAppMessage(cliente, currentCampaign.mensaje)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                  sentToClients.has(cliente.id)
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                                disabled={sentToClients.has(cliente.id)}
                              >
                                <span className="mr-1">{'\ud83d\udcf1'}</span>
                                {sentToClients.has(cliente.id) ? 'Enviado' : 'Enviar'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer del Modal */}
              <div className="flex justify-between items-center pt-4 border-t border-stone-600">
                <p className="text-gray-400 text-sm">
                  Enviados: {sentToClients.size} de {recipients.length}
                </p>
                <Button
                  onClick={() => {
                    setShowExecutionModal(false);
                    setCurrentCampaign(null);
                    setRecipients([]);
                    setSentToClients(new Set());
                  }}
                  variant="outline"
                  className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </MainLayout>
  );
}
