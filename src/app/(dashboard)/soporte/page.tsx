'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useJWTAuth } from '@/hooks/use-jwt-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  MessageCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  CreditCard,
  FileText,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function SoportePage() {
  const { planName } = usePlanPermissions();
  const { user } = useJWTAuth();
  const [configuracionGlobal, setConfiguracionGlobal] = useState<any>(null);

  // Estado para controlar qué FAQ está abierta
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  // Cargar configuración global
  useEffect(() => {
    const cargarConfiguracionGlobal = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_global')
          .select('*')
          .single();
        
        if (error) {
          console.error('Error cargando configuración global:', error);
        } else {
          setConfiguracionGlobal(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    cargarConfiguracionGlobal();
  }, []);

  // Preguntas frecuentes actualizadas y relevantes
  const faqs = [
    {
      id: 1,
      pregunta: '¿Cómo envío una campaña de cumpleaños?',
      respuesta: 'Ve al módulo de Marketing, selecciona la tarea diaria de Cumpleañeros y haz clic en el icono de WhatsApp de cada cliente.',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      id: 2,
      pregunta: '¿Cómo calculo las comisiones de los empleados?',
      respuesta: 'Las comisiones se calculan automáticamente cada vez que registras una venta y le asignas un empleado. Puedes ver el total en el módulo de Comisiones.',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 3,
      pregunta: '¿Puedo abrir el sistema en mi celular?',
      respuesta: '¡Sí! BeautyPro funciona perfectamente en navegadores móviles. Solo ingresa con tu correo y contraseña desde Chrome o Safari.',
      icon: <Phone className="w-4 h-4" />
    },
    {
      id: 4,
      pregunta: '¿Cómo realizo el pago de mi suscripción?',
      respuesta: `Puedes realizar tu pago por transferencia bancaria a ${configuracionGlobal?.banco || 'Bancolombia'} - ${configuracionGlobal?.tipo_cuenta || 'de Ahorro'} N° ${configuracionGlobal?.numero_cuenta || '1234-5678-9017'} a nombre de ${configuracionGlobal?.titular || 'Jojama'}. Después de pagar, envía el comprobante al WhatsApp de soporte.`,
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 5,
      pregunta: '¿Cómo agrego nuevos empleados al sistema?',
      respuesta: 'Ve al módulo de Usuarios, haz clic en "Agregar Nuevo Usuario" y completa los datos del empleado. El sistema le enviará un correo para que configure su contraseña.',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 6,
      pregunta: '¿Cómo respaldo mi información?',
      respuesta: 'Para respaldar tu información, ve al módulo de Configuración > Seguridad y Datos. Haz clic en "Crear Respaldo Completo" para generar una copia de seguridad de todos tus datos. El sistema guardará el respaldo en la nube y podrás descargarlo como archivo JSON. También puedes ver el historial de respaldos anteriores y eliminar los que necesites. Recomendamos hacer respaldos periódicos para proteger tu información.',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 7,
      pregunta: '¿Cómo cambio el porcentaje de IVA?',
      respuesta: 'El IVA se configura por cada producto individualmente. Ve al módulo de Productos, edita el producto que deseas modificar y selecciona el porcentaje de IVA aplicable (5% Reducido o 19% General) en la sección de configuración del producto.',
      icon: <Settings className="w-4 h-4" />
    },
    {
      id: 8,
      pregunta: '¿Qué incluye el módulo de compras?',
      respuesta: 'El módulo de compras te permite gestionar inventario, registrar proveedores, controlar gastos y generar reportes de costos. Todo integrado con tus ventas y finanzas.',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 9,
      pregunta: '¿Cómo verifico mis pagos?',
      respuesta: 'Ve al módulo de Finanzas y selecciona "Verificación de Pagos". Podrás ver el estado de todos tus pagos, fechas y descargar comprobantes.',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 10,
      pregunta: '¿Cómo gestiono el inventario de productos?',
      respuesta: 'Ve al módulo de Inventario donde podrás agregar productos, gestionar stock, establecer niveles mínimos, registrar proveedores y controlar el flujo de inventario en tiempo real.',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 11,
      pregunta: '¿Cómo funcionan las comisiones automáticas?',
      respuesta: 'Las comisiones se calculan automáticamente cada vez que registras una venta y asignas un empleado. El sistema aplica el porcentaje configurado en el perfil del empleado sobre el monto total de la venta.',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 12,
      pregunta: '¿Cómo administro las citas de los clientes?',
      respuesta: 'Ve al módulo de Citas donde podrás agendar, modificar o cancelar citas. El sistema te permite asignar estilistas, enviar recordatorios automáticos y gestionar el calendario de atención.',
      icon: <MessageCircle className="w-4 h-4" />
    },
    {
      id: 13,
      pregunta: '¿Cómo gestiono préstamos a empleados?',
      respuesta: 'Ve al módulo de Préstamos donde podrás registrar préstamos a empleados, establecer fechas de pago y hacer seguimiento de los saldos pendientes. Los préstamos se pueden descontar automáticamente de las comisiones.',
      icon: <CreditCard className="w-4 h-4" />
    },
    {
      id: 14,
      pregunta: '¿Qué información muestra Analytics?',
      respuesta: 'Analytics te muestra estadísticas detalladas de tu negocio: ventas por período, crecimiento de clientes, servicios más solicitados, rendimiento de empleados y tendencias del negocio con gráficos interactivos.',
      icon: <FileText className="w-4 h-4" />
    }
  ];

  // Función para contactar soporte por WhatsApp
  const contactarSoporte = async () => {
    try {
      // Obtener nombre de la empresa desde la base de datos
      let nombreEmpresa = 'mi empresa';
      if (user?.empresa_id) {
        const supabase = createClient();
        const { data: empresa, error } = await supabase
          .from('empresas')
          .select('nombre')
          .eq('id', user.empresa_id)
          .single();
        
        if (!error && empresa) {
          nombreEmpresa = (empresa as any).nombre;
        }
      }

      const whatsappNumber = configuracionGlobal?.whatsapp_soporte || '+573124943527';
      const mensaje = encodeURIComponent(`Hola, soy ${user?.nombre || 'un usuario'} de la empresa ${nombreEmpresa}. Necesito ayuda con el sistema BeautyPro.`);
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${mensaje}`, '_blank');
    } catch (error) {
      console.error('Error obteniendo nombre de empresa:', error);
      // Fallback a mensaje simple
      const whatsappNumber = configuracionGlobal?.whatsapp_soporte || '+573124943527';
      const mensaje = encodeURIComponent(`Hola, soy ${user?.nombre || 'un usuario'}. Necesito ayuda con el sistema BeautyPro.`);
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${mensaje}`, '_blank');
    }
  };

  // Toggle para abrir/cerrar FAQ
  const toggleFaq = (id: number) => {
    setFaqAbierta(faqAbierta === id ? null : id);
  };

  return (
    <MainLayout>
      <ProtectedRoute
        requiredPermission="priority_support"
        moduleInfo={{
          name: 'Soporte Prioritario',
          icon: '🚑',
          benefits: [
            'Atención personalizada 24/7',
            'Respuesta prioritaria en menos de 2 horas',
            'Acceso directo a asesores especializados'
          ]
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-gray-100 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Centro de Soporte Prioritario</h1>
            <p className="text-gray-600">Estamos aquí para ayudarte con cualquier problema o duda que tengas.</p>
          </div>

          {/* Contenido Principal - 2 Columnas en Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna Izquierda - Contacto Directo */}
            <div className="space-y-6">
              {/* Tarjeta de Atención Personalizada */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-amber-600" />
                    Atención Personalizada
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-6">
                    ¿Tienes problemas con el sistema o necesitas ayuda con tu plan? Escríbenos directamente y un asesor te atenderá de inmediato.
                  </p>
                  
                  {/* Botón de WhatsApp */}
                  <Button
                    onClick={contactarSoporte}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 text-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contactar por WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Tarjeta de Horario de Atención */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-600" />
                    Horario de Atención
                  </h3>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-gray-600">
                    <p className="font-medium text-gray-800 mb-2">Lunes a Sábado</p>
                    <p className="text-amber-600 font-semibold">8:00 AM - 6:00 PM</p>
                    <p className="text-gray-500 text-sm mt-2">Domingo: Cerrado</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha - Preguntas Frecuentes */}
            <div className="space-y-6">
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-amber-600" />
                    Preguntas Frecuentes
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-amber-300 transition-colors">
                        {/* Pregunta */}
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full px-4 py-3 bg-gray-50 hover:bg-amber-50 transition-colors flex items-center justify-between text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-amber-600">{faq.icon}</span>
                            <span className="text-gray-800 font-medium">{faq.pregunta}</span>
                          </div>
                          {faqAbierta === faq.id ? (
                            <ChevronUp className="w-4 h-4 text-amber-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-amber-600" />
                          )}
                        </button>
                        
                        {/* Respuesta */}
                        {faqAbierta === faq.id && (
                          <div className="px-4 py-3 bg-white border-t border-gray-200">
                            <p className="text-gray-600">{faq.respuesta}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
