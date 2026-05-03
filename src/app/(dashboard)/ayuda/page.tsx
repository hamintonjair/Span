'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import {
  HomeIcon,
  CreditCardIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UsersIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TruckIcon,
  TagIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  PresentationChartBarIcon,
  StarIcon,
  CogIcon,
  BuildingOfficeIcon,
  BellIcon,
  LockClosedIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

// Tipos para los módulos de ayuda
interface ModuloAyuda {
  id: string;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  plan?: string;
  contenido: {
    subtitulo: string;
    pasos: string[];
    tips?: string[];
  }[];
}

// Datos de los módulos de ayuda
const modulosAyuda: ModuloAyuda[] = [
  // === MÓDULOS BÁSICOS ===
  {
    id: 'dashboard',
    titulo: 'Dashboard / Resumen',
    descripcion: 'Entiende tus métricas y toma decisiones informadas',
    icono: <HomeIcon className="w-6 h-6" />,
    color: 'bg-blue-500',
    contenido: [
      {
        subtitulo: '¿Qué es el Dashboard?',
        pasos: [
          'Es tu centro de control donde ves todo lo importante de tu negocio de un vistazo.',
          'Aquí encontrarás gráficos de ventas, citas del día, productos más vendidos y alertas de stock.',
          'Las métricas se actualizan en tiempo real para que siempre tengas información actualizada.',
        ],
        tips: [
          'Revisa tu Dashboard cada mañana para planificar el día.',
          'Presta atención a las alertas de stock bajo para no quedarte sin productos.',
        ],
      },
      {
        subtitulo: 'Cómo leer las métricas principales',
        pasos: [
          'Ventas del día: Muestra el total vendido hoy comparado con ayer.',
          'Citas programadas: Número de citas para hoy con indicador de estado.',
          'Productos más vendidos: Top 5 de lo que más se vende esta semana.',
          'Ingresos vs Gastos: Gráfico comparativo del mes actual.',
        ],
        tips: [
          'Si las ventas están bajas, revisa las citas pendientes y envía recordatorios.',
          'Usa el filtro de fechas para comparar períodos y detectar tendencias.',
        ],
      },
    ],
  },
  {
    id: 'pos',
    titulo: 'Punto de Venta (POS)',
    descripcion: 'Registra ventas rápidas y gestiona pagos fácilmente',
    icono: <CreditCardIcon className="w-6 h-6" />,
    color: 'bg-green-500',
    contenido: [
      {
        subtitulo: 'Cómo hacer una venta',
        pasos: [
          'Ve a "Nueva Venta" en el menú lateral o haz clic en el botón POS desde el Dashboard.',
          'Busca y selecciona productos o servicios del catálogo (puedes usar el buscador).',
          'Ajusta cantidades si es necesario haciendo clic en los botones + o -.',
          'Selecciona el método de pago: Efectivo, Tarjeta, Transferencia o Nequi/Daviplata.',
          'Haz clic en "Completar Venta" para finalizar.',
          '¡Listo! El ticket se genera automáticamente y puedes imprimirlo.',
        ],
        tips: [
          'Usa atajos de teclado: F2 para buscar, ESC para cancelar, Enter para cobrar.',
          'Puedes agregar descuentos personalizados desde el ícono del ticket.',
          'Si te equivocas, no te preocupes: puedes anular la venta desde el Historial.',
        ],
      },
      {
        subtitulo: 'Cómo anular o reimprimir un ticket',
        pasos: [
          'Ve a "Ventas" > "Historial" en el menú lateral.',
          'Busca la venta que necesitas (usa el buscador por fecha o cliente).',
          'Haz clic en el botón del "ojo" para ver detalles de la venta.',
          'Para reimprimir: haz clic en "Imprimir Ticket" en el modal de detalles.',
          'Para anular: haz clic en "Anular Venta" (solo si eres admin). El stock se devuelve automáticamente.',
        ],
        tips: [
          'Solo los administradores pueden anular ventas por seguridad.',
          'Al anular una venta, los productos vuelven automáticamente al inventario.',
          'Guarda los tickets anulados para tu contabilidad.',
        ],
      },
    ],
  },
  {
    id: 'citas',
    titulo: 'Agenda / Citas',
    descripcion: 'Organiza la agenda de tu salón y gestiona reservas',
    icono: <CalendarIcon className="w-6 h-6" />,
    color: 'bg-purple-500',
    contenido: [
      {
        subtitulo: 'Cómo crear una cita',
        pasos: [
          'Ve a "Citas" > "Agenda" en el menú lateral.',
          'Selecciona el día y hora disponible en el calendario.',
          'Busca al cliente (o crea uno nuevo si es la primera vez).',
          'Selecciona el servicio que va a recibir y el estilista asignado.',
          'Agrega notas si es necesario (ej: "Llega con 15 min de retraso habitual").',
          'Haz clic en "Guardar Cita". El cliente recibirá confirmación.',
        ],
        tips: [
          'Configura los horarios de cada estilista para que solo aparezcan sus disponibilidades.',
          'Usa colores diferentes para cada tipo de servicio (corte, tinte, etc.).',
          'Envía recordatorios automáticos por WhatsApp o SMS un día antes.',
        ],
      },
      {
        subtitulo: 'Gestión de Citas (Vista avanzada)',
        pasos: [
          'Ve a "Citas" > "Gestión de Citas" para una vista detallada de todas las reservas.',
          'Filtra por estilista, fecha, estado (confirmada, pendiente, cancelada).',
          'Arrastra citas para cambiar horarios si el cliente solicita modificación.',
          'Marca citas como "En servicio" cuando el cliente llegue.',
          'Al finalizar, convierte la cita automáticamente en una venta.',
        ],
        tips: [
          'La vista de gestión es ideal para recepcionistas que manejan múltiples estilistas.',
          'Configura recordatorios automáticos 24h antes para reduc cancellations.',
          'Usa el historial de citas canceladas para identificar patrones.',
        ],
      },
    ],
  },
  {
    id: 'inventario',
    titulo: 'Inventario (Productos/Servicios)',
    descripcion: 'Controla tu stock y catálogo de servicios',
    icono: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'bg-orange-500',
    contenido: [
      {
        subtitulo: 'Cómo crear un producto',
        pasos: [
          'Ve a "Inventario" > "Productos" en el menú lateral.',
          'Haz clic en "Nuevo Producto" (botón verde superior derecha).',
          'Completa: Nombre, Categoría, Precio de venta, Costo, Stock inicial.',
          'Agrega una descripción y sube una foto (opcional pero recomendado).',
          'Configura el stock mínimo para recibir alertas cuando esté bajo.',
          'Guarda el producto. Aparecerá automáticamente en el POS.',
        ],
        tips: [
          'Usa códigos SKU para identificación rápida (ej: SHAMP-001).',
          'Define categorías claras: Shampoo, Acondicionador, Tintes, etc.',
          'El costo es interno; el precio de venta es lo que paga el cliente.',
        ],
      },
      {
        subtitulo: 'Cómo configurar servicios',
        pasos: [
          'Ve a "Inventario" > "Servicios" en el menú lateral.',
          'Haz clic en "Nuevo Servicio".',
          'Define: Nombre del servicio, Precio, Duración estimada, Comisión del estilista.',
          'Asigna los estilistas que pueden realizar este servicio.',
          'Agrega una descripción atractiva para el catálogo.',
          'Guarda y el servicio estará disponible en citas y POS.',
        ],
        tips: [
          'Define duraciones realistas para evitar traslapes en la agenda.',
          'Configura comisiones automáticas para motivar a tu equipo.',
          'Crea paquetes (ej: "Día de spa") combinando varios servicios con descuento.',
        ],
      },
      {
        subtitulo: 'Manejo de stock y alertas',
        pasos: [
          'En "Inventario" > "Productos" verás todos tus productos con stock actual.',
          'Los productos con stock bajo aparecen en rojo con alerta.',
          'Haz clic en "Ajustar Stock" para agregar unidades manualmente.',
          'El stock disminuye automáticamente con cada venta.',
          'Genera reportes de inventario para saber qué necesitas comprar.',
        ],
        tips: [
          'Haz inventario físico mensualmente y ajusta diferencias en el sistema.',
          'Configura proveedores habituales para pedidos rápidos.',
          'Analiza qué productos rotan más para mantener stock de seguridad.',
        ],
      },
    ],
  },
  {
    id: 'categorias',
    titulo: 'Categorías',
    descripcion: 'Organiza tus productos y servicios por categorías',
    icono: <TagIcon className="w-6 h-6" />,
    color: 'bg-pink-500',
    contenido: [
      {
        subtitulo: 'Cómo crear categorías',
        pasos: [
          'Ve a "Categorías" en el menú lateral (solo administradores).',
          'Haz clic en "Nueva Categoría".',
          'Define el nombre (ej: "Tintes", "Tratamientos Capilares", "Corte").',
          'Agrega una descripción opcional.',
          'Selecciona si es para productos, servicios o ambos.',
          'Guarda y las categorías estarán disponibles al crear productos/servicios.',
        ],
        tips: [
          'Crea categorías claras para facilitar la búsqueda en el POS.',
          'Usa nombres que entienda todo tu equipo.',
          'Puedes reorganizar categorías sin afectar productos existentes.',
        ],
      },
    ],
  },
  {
    id: 'proveedores',
    titulo: 'Proveedores',
    descripcion: 'Gestiona tus proveedores y pedidos',
    icono: <TruckIcon className="w-6 h-6" />,
    color: 'bg-indigo-500',
    contenido: [
      {
        subtitulo: 'Registrar proveedores',
        pasos: [
          'Ve a "Proveedores" en el menú lateral.',
          'Haz clic en "Nuevo Proveedor".',
          'Completa: Nombre de la empresa, contacto, teléfono, correo.',
          'Agrega dirección y datos de facturación si es necesario.',
          'Registra los productos que usualmente suministran.',
          'Guarda para tenerlos disponibles en pedidos.',
        ],
        tips: [
          'Mantén actualizados los datos de contacto de tus proveedores principales.',
          'Registra múltiples proveedores por producto para comparar precios.',
          'Usa las notas para recordar condiciones de pago o descuentos.',
        ],
      },
      {
        subtitulo: 'Hacer pedidos a proveedores',
        pasos: [
          'Desde "Proveedores", selecciona el proveedor deseado.',
          'Haz clic en "Nuevo Pedido".',
          'Selecciona los productos y cantidades necesarias.',
          'El sistema calcula el total estimado.',
          'Envía el pedido por correo o WhatsApp directamente desde el sistema.',
          'Al recibir, actualiza el estado a "Recibido" y el stock se incrementa automáticamente.',
        ],
        tips: [
          'Configura stock mínimos para generar alertas de pedido automáticas.',
          'Compara precios entre proveedores antes de hacer pedidos grandes.',
          'Registra el tiempo de entrega de cada proveedor para planificar mejor.',
        ],
      },
    ],
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas y Caja',
    descripcion: 'Controla el dinero: aperturas, cierres y gastos',
    icono: <CurrencyDollarIcon className="w-6 h-6" />,
    color: 'bg-emerald-500',
    contenido: [
      {
        subtitulo: 'Apertura de caja (Inicio de día)',
        pasos: [
          'Ve a "Caja" en el menú lateral.',
          'Haz clic en "Abrir Caja" si es la primera operación del día.',
          'Ingresa el monto inicial (base de cambio) en efectivo.',
          'Verifica que el dinero físico coincida con lo registrado.',
          'Confirma y la caja quedará abierta para recibir ventas.',
        ],
        tips: [
          'La base de cambio típica es $50,000-$100,000 para vueltas.',
          'Solo un usuario debe abrir la caja por turno.',
          'Si olvidas abrir caja, las ventas quedarán como "pendientes de caja".',
        ],
      },
      {
        subtitulo: 'Cierre de caja (Fin de día)',
        pasos: [
          'Al finalizar el día, ve a "Caja".',
          'Haz clic en "Cerrar Caja".',
          'El sistema mostrará: ventas en efectivo, tarjeta, transferencias.',
          'Cuenta el dinero físico y compara con el sistema.',
          'Registra cualquier diferencia (sobrante o faltante).',
          'Confirma el cierre. ¡Listo! Se genera un reporte del día.',
        ],
        tips: [
          'Haz el cierre siempre con la misma persona que abrió.',
          'Imprime el reporte de cierre para tu contador.',
          'Investiga cualquier diferencia mayor a $5,000 inmediatamente.',
        ],
      },
      {
        subtitulo: 'Registrar gastos diarios',
        pasos: [
          'En "Finanzas" > "Gastos", haz clic en "Nuevo Gasto".',
          'Selecciona la categoría: Suministros, Alimentación, Servicios, etc.',
          'Ingresa el monto y descripción detallada.',
          'Adjunta foto del recibo/factura (opcional pero recomendado).',
          'Guarda. El gasto se deduce automáticamente del balance del día.',
        ],
        tips: [
          'Registra TODO: hasta el café de los empleados y las pinzas que compras.',
          'Categoriza bien para reportes fiscales claros.',
          'Los gastos afectan directamente tu utilidad neta del mes.',
        ],
      },
    ],
  },
  {
    id: 'prestamos',
    titulo: 'Préstamos',
    descripcion: 'Gestiona préstamos a empleados',
    icono: <CurrencyDollarIcon className="w-6 h-6" />,
    color: 'bg-yellow-500',
    contenido: [
      {
        subtitulo: 'Cómo registrar un préstamo',
        pasos: [
          'Ve a "Préstamos" en el menú lateral.',
          'Haz clic en "Nuevo Préstamo".',
          'Selecciona el empleado que solicita el préstamo.',
          'Ingresa el monto total y número de cuotas.',
          'Define el valor de cada cuota (el sistema calcula automáticamente).',
          'Establece la fecha de inicio del descuento.',
          'Guarda. El préstamo aparecerá en la nómina del empleado.',
        ],
        tips: [
          'Los préstamos se descuentan automáticamente de la nómina en las cuotas definidas.',
          'Puedes ver el saldo pendiente en cualquier momento.',
          'Configura límites de préstamo por empleado según antigüedad.',
        ],
      },
      {
        subtitulo: 'Gestionar préstamos activos',
        pasos: [
          'En "Préstamos" > "Activos" verás todos los préstamos vigentes.',
          'Filtra por empleado para ver su historial completo.',
          'Puedes hacer abonos extraordinarios si el empleado desea pagar más rápido.',
          'Al completar todas las cuotas, el préstamo se marca como "Pagado".',
          'Exporta reportes de préstamos para tu contabilidad.',
        ],
        tips: [
          'Mantén un registro claro de préstamos para evitar confusiones en nómina.',
          'Comunica claramente las condiciones antes de aprobar.',
          'Considera políticas de préstamo máximo por empleado.',
        ],
      },
    ],
  },
  {
    id: 'comisiones',
    titulo: 'Empleados y Comisiones',
    descripcion: 'Gestiona a tu equipo y sus ganancias',
    icono: <UserGroupIcon className="w-6 h-6" />,
    color: 'bg-rose-500',
    contenido: [
      {
        subtitulo: 'Cómo ver comisiones por estilista',
        pasos: [
          'Ve a "Comisiones" > "Reporte" en el menú lateral.',
          'Selecciona el período: semana, quincena o mes.',
          'Verás el listado de estilistas con sus totales.',
          'Haz clic en un estilista para ver el detalle: servicios, productos, totales.',
          'Exporta a Excel o PDF para pagos de nómina.',
        ],
        tips: [
          'Las comisiones se calculan automáticamente según configuración de cada servicio.',
          'Puedes ajustar porcentajes individuales por estilista.',
          'Algunos salones pagan comisión solo sobre servicios, otros sobre productos también.',
        ],
      },
      {
        subtitulo: 'Configurar empleados nuevos',
        pasos: [
          'Ve a "Empleados" (o "Configuración" > "Empleados").',
          'Haz clic en "Nuevo Empleado".',
          'Completa datos personales, correo y teléfono.',
          'Asigna el rol: Estilista, Recepcionista o Administrador.',
          'Define su porcentaje de comisión por defecto.',
          'Establece horario de trabajo y días disponibles.',
          'Guarda. El empleado recibirá credenciales por correo.',
        ],
        tips: [
          'Cada empleado debe tener su propio usuario (no compartas cuentas).',
          'Los recepcionistas pueden agendar citas pero no ver finanzas.',
          'Los estilistas solo ven sus propias citas y comisiones.',
        ],
      },
    ],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    descripcion: 'Gestiona los usuarios del sistema',
    icono: <UsersIcon className="w-6 h-6" />,
    color: 'bg-slate-500',
    contenido: [
      {
        subtitulo: 'Crear nuevos usuarios',
        pasos: [
          'Ve a "Usuarios" en el menú lateral (solo administradores).',
          'Haz clic en "Nuevo Usuario".',
          'Completa: Nombre, correo electrónico, teléfono.',
          'Asigna un rol: Admin Empresa, Recepcionista, Estilista.',
          'Define permisos específicos según sus responsabilidades.',
          'El sistema enviará un correo con credenciales temporales.',
        ],
        tips: [
          'Nunca compartas tu cuenta de administrador.',
          'Desactiva usuarios de empleados que renuncian inmediatamente.',
          'Revisa los logs de actividad periódicamente por seguridad.',
        ],
      },
      {
        subtitulo: 'Gestión de permisos',
        pasos: [
          'En "Usuarios" > "Permisos" puedes configurar acceso granular.',
          'Define qué módulos puede ver cada rol.',
          'Configura permisos especiales: anular ventas, ver finanzas, exportar datos.',
          'Guarda cambios y aplican inmediatamente.',
          'Puedes crear roles personalizados si los estándar no se ajustan.',
        ],
        tips: [
          'Principio de mínimo privilegio: solo da acceso a lo necesario.',
          'Audita permisos mensualmente.',
          'Capacita a tu equipo sobre seguridad de contraseñas.',
        ],
      },
    ],
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    descripcion: 'Ficha de clientes y historial completo',
    icono: <ShoppingBagIcon className="w-6 h-6" />,
    color: 'bg-cyan-500',
    contenido: [
      {
        subtitulo: 'Registrar un nuevo cliente',
        pasos: [
          'Ve a "Clientes" > "Listado" y haz clic en "Nuevo Cliente".',
          'Completa: Nombre completo, Teléfono (obligatorio), Correo, Fecha de nacimiento.',
          'Agrega notas útiles: alergias, preferencias, tipo de cabello.',
          'El sistema puede enviar mensaje de bienvenida automático.',
          'Guarda y el cliente queda registrado para futuras citas/ventas.',
        ],
        tips: [
          'El teléfono es clave para enviar recordatorios de citas.',
          'Usa la fecha de nacimiento para enviar promos de cumpleaños.',
          'Registra alergias a productos para evitar incidentes.',
        ],
      },
      {
        subtitulo: 'Ver historial de cliente',
        pasos: [
          'En "Clientes" > "Listado", busca por nombre o teléfono.',
          'Haz clic en el cliente para abrir su ficha completa.',
          'Verás: datos personales, historial de citas, compras realizadas, gasto total.',
          'Revisa qué productos ha comprado para recomendaciones personalizadas.',
          'Consulta citas pasadas y futuras.',
        ],
        tips: [
          'Identifica tus "VIP": clientes con mayor gasto acumulado.',
          'Revisa el historial antes de atender para personalizar el servicio.',
          'Contacta clientes que no vienen hace +60 días con promociones especiales.',
        ],
      },
    ],
  },
  
  // === MÓDULOS PREMIUM (requieren plan) ===
  {
    id: 'nominas',
    titulo: 'Nóminas',
    descripcion: 'Gestiona la nómina de tu equipo automáticamente',
    icono: <CurrencyDollarIcon className="w-6 h-6" />,
    color: 'bg-violet-500',
    plan: 'Plan Pro o Superior',
    contenido: [
      {
        subtitulo: 'Cómo generar una nómina',
        pasos: [
          'Ve a "Nóminas" en el menú lateral (requiere plan Pro).',
          'Selecciona el período: semana, quincena o mes.',
          'El sistema calcula automáticamente: comisiones + salario base - préstamos - deducciones.',
          'Revisa el resumen por empleado antes de confirmar.',
          'Haz clic en "Generar Nómina" para crear el documento.',
          'Exporta a PDF o Excel para tu contador.',
        ],
        tips: [
          'Las nóminas incluyen automáticamente comisiones de servicios y productos.',
          'Los préstamos se descuentan en las cuotas configuradas.',
          'Puedes agregar bonificaciones o deducciones manuales.',
        ],
      },
      {
        subtitulo: 'Reportes de nómina',
        pasos: [
          'En "Nóminas" > "Historial" encuentras todas las nóminas generadas.',
          'Filtra por fecha, empleado o período.',
          'Compara nóminas entre meses para detectar variaciones.',
          'Exporta reportes consolidados para contabilidad.',
          'Los empleados pueden ver sus recibos desde su portal.',
        ],
        tips: [
          'Conserva copias de respaldo de todas las nóminas.',
          'Configura recordatorios de pago de nómina.',
          'Integra con sistemas bancarios para transferencias masivas.',
        ],
      },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing',
    descripcion: 'Campañas de fidelización y captación de clientes',
    icono: <MegaphoneIcon className="w-6 h-6" />,
    color: 'bg-fuchsia-500',
    plan: 'Plan Pro o Superior',
    contenido: [
      {
        subtitulo: 'Crear campañas de marketing',
        pasos: [
          'Ve a "Marketing" en el menú lateral (requiere plan Pro).',
          'Haz clic en "Nueva Campaña".',
          'Selecciona el tipo: Cumpleaños, Reactivación, Promoción, Recordatorio.',
          'Define el público objetivo: todos, VIP, inactivos, etc.',
          'Crea el mensaje usando plantillas o personalizado.',
          'Programa el envío: inmediato o fecha específica.',
        ],
        tips: [
          'Las campañas de cumpleaños tienen alta tasa de conversión.',
          'No saturar: máximo 1 mensaje por semana por cliente.',
          'Incluye siempre un CTA claro: "Reserva ahora", "Aprovecha descuento".',
        ],
      },
      {
        subtitulo: 'Análisis de campañas',
        pasos: [
          'En "Marketing" > "Resultados" ver métricas de cada campaña.',
          'Revisa: mensajes enviados, entregados, abiertos, conversiones.',
          'Calcula el ROI: ingresos generados vs costo de la campaña.',
          'Identifica qué tipo de mensajes funcionan mejor con tu audiencia.',
          'Ajusta futuras campañas basándote en los datos.',
        ],
        tips: [
          'A/B testing: prueba diferentes mensajes para ver qué funciona.',
          'Segmenta bien: mensajes diferentes para hombres/mujeres, edades.',
          'Mide resultados al menos 7 días después del envío.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    titulo: 'Analytics',
    descripcion: 'Análisis avanzado de tu negocio',
    icono: <PresentationChartBarIcon className="w-6 h-6" />,
    color: 'bg-teal-500',
    plan: 'Plan Pro o Superior',
    contenido: [
      {
        subtitulo: 'Reportes avanzados',
        pasos: [
          'Ve a "Analytics" en el menú lateral (requiere plan Pro).',
          'Explora reportes predefinidos: ventas, citas, clientes, empleados.',
          'Usa filtros de fecha para comparar períodos.',
          'Genera gráficos personalizados seleccionando métricas.',
          'Exporta en PDF, Excel o comparte por correo.',
          'Programa reportes automáticos semanales/mensuales.',
        ],
        tips: [
          'Revisa el reporte de "Clientes Inactivos" mensualmente.',
          'El análisis de tendencias te ayuda a planificar inventario.',
          'Comparte reportes con tu contador fácilmente.',
        ],
      },
      {
        subtitulo: 'KPIs y métricas clave',
        pasos: [
          'En "Analytics" > "Dashboard KPI" encuentra indicadores clave.',
          'Ticket promedio: ventas totales / número de transacciones.',
          'Tasa de retención: clientes que vuelven / clientes totales.',
          'Ocupación de agenda: citas realizadas / citas disponibles.',
          'Productividad por estilista: ventas / horas trabajadas.',
          'Compara estos KPIs con períodos anteriores.',
        ],
        tips: [
          'Establece metas mensuales para cada KPI.',
          'Reconoce públicamente a los mejores desempeños.',
          'Usa los datos para capacitaciones específicas.',
        ],
      },
    ],
  },
  {
    id: 'soporte-prioritario',
    titulo: 'Soporte Prioritario',
    descripcion: 'Acceso directo a ayuda especializada',
    icono: <StarIcon className="w-6 h-6" />,
    color: 'bg-amber-500',
    plan: 'Plan Elite o Superior',
    contenido: [
      {
        subtitulo: 'Cómo usar el soporte prioritario',
        pasos: [
          'Ve a "Soporte Prioritario" en el menú lateral (plan Elite).',
          'Crea un nuevo ticket describiendo tu problema o consulta.',
          'Adjunta capturas de pantalla si es necesario.',
          'Selecciona la prioridad: baja, media, alta, crítica.',
          'El equipo responde en menos de 2 horas (horario laboral).',
          'Recibe notificaciones cuando haya actualizaciones.',
        ],
        tips: [
          'Incluye toda la información posible para agilizar la respuesta.',
          'Para urgencias, usa el chat en vivo disponible 24/7.',
          'Revisa la base de conocimientos antes de crear un ticket.',
        ],
      },
    ],
  },
  
  // === CONFIGURACIÓN ===
  {
    id: 'configuracion',
    titulo: 'Configuración',
    descripcion: 'Personaliza tu BeautyPro',
    icono: <CogIcon className="w-6 h-6" />,
    color: 'bg-gray-600',
    contenido: [
      {
        subtitulo: 'Configuración general',
        pasos: [
          'Ve a "Configuración" en el menú lateral (solo administradores).',
          'En "General": nombre del negocio, logo, datos de contacto.',
          'En "Horarios": define los horarios de atención del salón.',
          'En "Impresión": configura ticket (tamaño, mensaje de pie).',
          'En "Notificaciones": activa/desactiva alertas automáticas.',
          'Guarda cambios y se aplican inmediatamente.',
        ],
        tips: [
          'Personaliza tu ticket con un mensaje de agradecimiento.',
          'Configura backups automáticos de tu información.',
          'Revisa la configuración de IVA/impuestos para tu país.',
        ],
      },
      {
        subtitulo: 'Configuración avanzada',
        pasos: [
          'En "Configuración" > "Avanzado" encuentras opciones extras.',
          'Integraciones: conecta WhatsApp Business, SMS, correo.',
          'Permisos de rol: define qué puede hacer cada tipo de usuario.',
          'Personalización: colores, temas, campos personalizados.',
          'Importar/Exportar: respalda o migra tus datos.',
        ],
        tips: [
          'Haz una copia de seguridad antes de cambios importantes.',
          'Consulta con soporte antes de modificar configuraciones avanzadas.',
          'Documenta los cambios para tu equipo.',
        ],
      },
    ],
  },
  
  // === MÓDULOS ADMIN_GLOBAL ===
  {
    id: 'empresas',
    titulo: 'Empresas (Admin)',
    descripcion: 'Gestión de empresas registradas en la plataforma',
    icono: <BuildingOfficeIcon className="w-6 h-6" />,
    color: 'bg-red-600',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Gestionar empresas',
        pasos: [
          'Ve a "Empresas" en el menú lateral (solo admin_global).',
          'Verás el listado de todas las empresas registradas.',
          'Haz clic en una empresa para ver detalles: plan, vencimiento, usuarios.',
          'Puedes suspender, reactivar o cambiar el plan de cualquier empresa.',
          'Envía comunicaciones masivas a todos los administradores.',
          'Accede a reportes consolidados de toda la plataforma.',
        ],
        tips: [
          'Monitorea empresas con pagos pendientes.',
          'Revisa el uso de recursos para optimizar servidores.',
          'Envía newsletters con novedades a todos los clientes.',
        ],
      },
    ],
  },
  {
    id: 'suscripciones-admin',
    titulo: 'Suscripciones (Admin)',
    descripcion: 'Gestión de pagos y suscripciones',
    icono: <CreditCardIcon className="w-6 h-6" />,
    color: 'bg-red-700',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Administrar suscripciones',
        pasos: [
          'Ve a "Suscripciones" en el menú lateral (solo admin_global).',
          'Verás pagos pendientes, activos y vencidos.',
          'Procesa pagos manuales si es necesario.',
          'Gestiona reembolsos según política de la empresa.',
          'Genera reportes financieros de la plataforma.',
          'Configura promociones y códigos de descuento.',
        ],
        tips: [
          'Revisa métricas de churn (cancelaciones) mensualmente.',
          'Identifica oportunidades de upsell.',
          'Automatiza recordatorios de pago.',
        ],
      },
    ],
  },
  {
    id: 'planes-beneficios',
    titulo: 'Planes y Beneficios',
    descripcion: 'Configura los planes disponibles',
    icono: <RocketLaunchIcon className="w-6 h-6" />,
    color: 'bg-red-800',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Gestionar planes',
        pasos: [
          'Ve a "Planes y Beneficios" (solo admin_global).',
          'Crea nuevos planes: Básico, Pro, Elite, Enterprise.',
          'Define precios, límites y funcionalidades incluidas.',
          'Configura trial gratuito para cada plan.',
          'Establece upgrades/downgrades automáticos.',
          'Comunica cambios en planes a los clientes.',
        ],
        tips: [
          'Analiza competencia para precios competitivos.',
          'Ofrece descuentos por pago anual.',
          'Crea planes personalizados para clientes grandes.',
        ],
      },
    ],
  },
  {
    id: 'auditoria',
    titulo: 'Auditoría',
    descripcion: 'Logs de todas las acciones del sistema',
    icono: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'bg-red-500',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Revisar logs de auditoría',
        pasos: [
          'Ve a "Auditoría" en el menú lateral (solo admin_global).',
          'Filtra por fecha, usuario, empresa o tipo de acción.',
          'Revisa: inicios de sesión, ventas, modificaciones, eliminaciones.',
          'Detecta actividad sospechosa o errores del sistema.',
          'Exporta logs para análisis forense si es necesario.',
          'Configura alertas de seguridad automáticas.',
        ],
        tips: [
          'Revisa logs diariamente por seguridad.',
          'Investiga múltiples intentos de login fallidos.',
          'Conserva logs por al menos 1 año.',
        ],
      },
    ],
  },
  {
    id: 'comunicacion',
    titulo: 'Comunicación',
    descripcion: 'Envía notificaciones a usuarios',
    icono: <BellIcon className="w-6 h-6" />,
    color: 'bg-orange-600',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Comunicaciones masivas',
        pasos: [
          'Ve a "Comunicación" en el menú lateral (solo admin_global).',
          'Crea mensajes para todos los usuarios o segmenta por plan.',
          'Programa mantenimientos o anuncios de nuevas funciones.',
          'Envía newsletters mensuales con tips y novedades.',
          'Revisa estadísticas de apertura y clicks.',
        ],
        tips: [
          'Comunica mantenimientos con al menos 48h de anticipación.',
          'Personaliza mensajes según el plan del cliente.',
          'Mide engagement para mejorar comunicaciones.',
        ],
      },
    ],
  },
  {
    id: 'staff-tecnico',
    titulo: 'Staff Técnico',
    descripcion: 'Gestión del equipo de soporte técnico',
    icono: <UserGroupIcon className="w-6 h-6" />,
    color: 'bg-indigo-600',
    plan: 'Super Admin',
    contenido: [
      {
        subtitulo: 'Gestionar equipo técnico',
        pasos: [
          'Ve a "Staff Técnico" (solo admin_global).',
          'Administra usuarios con rol de soporte técnico.',
          'Asigna tickets a agentes específicos.',
          'Revisa métricas de resolución por agente.',
          'Configura horarios de atención del equipo.',
          'Gestiona escalaciones de problemas complejos.',
        ],
        tips: [
          'Capacita constantemente al equipo en nuevas funcionalidades.',
          'Establece SLAs claros para tiempos de respuesta.',
          'Revisa satisfacción del cliente post-soporte.',
        ],
      },
    ],
  },
  
  // === MI SUSCRIPCIÓN ===
  {
    id: 'mi-suscripcion',
    titulo: 'Mi Suscripción',
    descripcion: 'Gestiona tu plan y pagos',
    icono: <CurrencyDollarIcon className="w-6 h-6" />,
    color: 'bg-blue-600',
    contenido: [
      {
        subtitulo: 'Ver y gestionar tu plan',
        pasos: [
          'Ve a "Mi Suscripción" en el menú lateral.',
          'Verás tu plan actual, fecha de vencimiento y funcionalidades incluidas.',
          'Haz clic en "Mejorar Plan" para ver opciones superiores.',
          'Compara funcionalidades y precios entre planes.',
          'Realiza upgrade/downgrade en cualquier momento.',
          'El cambio aplica inmediatamente o al siguiente ciclo de facturación.',
        ],
        tips: [
          'Revisa anualmente si tu plan actual se ajusta a tus necesidades.',
          'Considera pago anual para obtener descuentos.',
          'Contacta soporte si necesitas un plan personalizado.',
        ],
      },
      {
        subtitulo: 'Historial de pagos',
        pasos: [
          'En "Mi Suscripción" > "Facturación" encuentras todos tus pagos.',
          'Descarga facturas en PDF para tu contabilidad.',
          'Actualiza tu método de pago cuando sea necesario.',
          'Configura pagos automáticos para evitar suspensiones.',
          'Revisa el estado de tus suscripciones adicionales.',
        ],
        tips: [
          'Guarda copias de todas las facturas.',
          'Configura alertas de vencimiento.',
          'Contacta soporte ante cualquier duda de facturación.',
        ],
      },
    ],
  },
];

export default function AyudaPage() {
  const [busqueda, setBusqueda] = useState('');
  const [modulosExpandidos, setModulosExpandidos] = useState<Set<string>>(new Set());
  const [filtroPlan, setFiltroPlan] = useState<'todos' | 'basico' | 'premium' | 'admin'>('todos');
  const [configGlobal, setConfigGlobal] = useState<any>(null);

  useEffect(() => {
    const fetchConfigGlobal = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_global')
          .select('titular')
          .single();

        if (error) {
          console.error('Error cargando configuración global:', error);
        } else {
          setConfigGlobal(data);
        }
      } catch (error) {
        console.error('Error general cargando configuración global:', error);
      }
    };

    fetchConfigGlobal();
  }, []);

  const getNombreEmpresa = () => {
    return configGlobal?.titular;
  };

  // Crear versión modificada del array con nombre dinámico
  const modulosAyudaConNombre = useMemo(() => {
    return modulosAyuda.map(modulo => {
      if (modulo.descripcion && modulo.descripcion.includes('BeautyPro')) {
        return {
          ...modulo,
          descripcion: modulo.descripcion.replace('BeautyPro', getNombreEmpresa())
        };
      }
      return modulo;
    });
  }, [configGlobal]);

  // Toggle de módulo expandido
  const toggleModulo = (id: string) => {
    const nuevos = new Set(modulosExpandidos);
    if (nuevos.has(id)) {
      nuevos.delete(id);
    } else {
      nuevos.add(id);
    }
    setModulosExpandidos(nuevos);
  };

  // Expandir todos los resultados de búsqueda
  const expandirTodos = () => {
    setModulosExpandidos(new Set(modulosFiltrados.map(m => m.id)));
  };

  // Colapsar todos
  const colapsarTodos = () => {
    setModulosExpandidos(new Set());
  };

  // Filtrar módulos según búsqueda y filtro de plan
  const modulosFiltrados = useMemo(() => {
    let filtrados = modulosAyudaConNombre;
    
    // Filtrar por plan
    if (filtroPlan !== 'todos') {
      filtrados = filtrados.filter(modulo => {
        if (filtroPlan === 'basico') return !modulo.plan;
        if (filtroPlan === 'premium') return modulo.plan && !modulo.plan.includes('Super Admin');
        if (filtroPlan === 'admin') return modulo.plan?.includes('Super Admin');
        return true;
      });
    }
    
    // Filtrar por búsqueda
    if (!busqueda.trim()) return filtrados;
    
    const termino = busqueda.toLowerCase();
    return filtrados.filter(modulo => 
      modulo.titulo.toLowerCase().includes(termino) ||
      modulo.descripcion.toLowerCase().includes(termino) ||
      modulo.contenido.some(seccion => 
        seccion.subtitulo.toLowerCase().includes(termino) ||
        seccion.pasos.some(paso => paso.toLowerCase().includes(termino)) ||
        seccion.tips?.some(tip => tip.toLowerCase().includes(termino))
      )
    );
  }, [busqueda, filtroPlan]);

  // Estadísticas de ayuda
  const stats = [
    { label: 'Módulos', value: modulosAyudaConNombre.length },
    { label: 'Guías', value: modulosAyudaConNombre.reduce((acc, m) => acc + m.contenido.length, 0) },
    { label: 'Consejos', value: modulosAyudaConNombre.reduce((acc, m) => acc + m.contenido.reduce((a, c) => a + (c.tips?.length || 0), 0), 0) },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header con Buscador */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <LightBulbIcon className="w-6 h-6" />
              </div>
              <span className="text-amber-100 font-medium">Centro de Ayuda</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cómo podemos ayudarte hoy?
            </h1>
            <p className="text-amber-100 text-lg mb-8 max-w-2xl">
              Manual completo de {getNombreEmpresa()}. Busca temas específicos o explora nuestros módulos de aprendizaje.
            </p>

            {/* Buscador Principal */}
            <div className="relative max-w-2xl mb-6">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Busca ayuda (ej: ¿Cómo anular una venta? o Cómo crear citas...)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-0 shadow-lg bg-white text-gray-800 placeholder:text-gray-400"
              />
              {busqueda && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    colapsarTodos();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-sm">Limpiar</span>
                </button>
              )}
            </div>

            {/* Filtros por plan */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroPlan('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroPlan === 'todos' 
                    ? 'bg-white text-amber-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Todos los módulos
              </button>
              <button
                onClick={() => setFiltroPlan('basico')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroPlan === 'basico' 
                    ? 'bg-white text-amber-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Plan Básico
              </button>
              <button
                onClick={() => setFiltroPlan('premium')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroPlan === 'premium' 
                    ? 'bg-white text-amber-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Plan Pro/Elite
              </button>
              <button
                onClick={() => setFiltroPlan('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroPlan === 'admin' 
                    ? 'bg-white text-amber-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Admin Global
              </button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="flex gap-6 mt-6">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-amber-200">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Controles de expansión */}
          {modulosFiltrados.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              {busqueda ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span>
                    {modulosFiltrados.length} resultado{modulosFiltrados.length !== 1 ? 's' : ''} para &quot;{busqueda}&quot;
                  </span>
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandirTodos}>
                  Expandir todos
                </Button>
                <Button variant="outline" size="sm" onClick={colapsarTodos}>
                  Colapsar todos
                </Button>
              </div>
            </div>
          )}

          {/* Grid de Módulos */}
          {modulosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No encontramos resultados
              </h3>
              <p className="text-gray-500 mb-4">
                Intenta con otros términos como &quot;ventas&quot;, &quot;citas&quot;, &quot;inventario&quot; o &quot;caja&quot;
              </p>
              <Button onClick={() => {setBusqueda(''); setFiltroPlan('todos');}} variant="outline">
                Ver todos los módulos
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {modulosFiltrados.map((modulo) => {
                const expandido = modulosExpandidos.has(modulo.id);
                return (
                  <Card key={modulo.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                    {/* Header del Módulo (clickeable) */}
                    <div 
                      onClick={() => toggleModulo(modulo.id)}
                      className="px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${modulo.color} text-white p-3 rounded-xl shadow-md flex-shrink-0`}>
                          {modulo.icono}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-800">
                              {modulo.titulo}
                            </h2>
                            {modulo.plan && (
                              <Badge variant="secondary" className="text-xs">
                                <LockClosedIcon className="w-3 h-3 mr-1" />
                                {modulo.plan}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {modulo.descripcion}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant="secondary">
                            {modulo.contenido.length} guía{modulo.contenido.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            {expandido ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    {expandido && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="pt-6 space-y-8">
                          {modulo.contenido.map((seccion, idx) => (
                            <div key={idx} className="bg-white rounded-xl">
                              <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                  {idx + 1}
                                </div>
                                {seccion.subtitulo}
                              </h3>

                              {/* Pasos */}
                              <div className="space-y-3 mb-6 ml-11">
                                {seccion.pasos.map((paso, pasoIdx) => (
                                  <div key={pasoIdx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-6 h-6 bg-white text-amber-600 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 mt-0.5">
                                      {pasoIdx + 1}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {paso}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Tips/Consejos */}
                              {seccion.tips && seccion.tips.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 ml-11">
                                  <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                    <LightBulbIcon className="w-4 h-4" />
                                    Consejos destacados
                                  </h4>
                                  <ul className="space-y-2">
                                    {seccion.tips.map((tip, tipIdx) => (
                                      <li key={tipIdx} className="flex items-start gap-2 text-sm text-amber-700">
                                        <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Footer de ayuda */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <InformationCircleIcon className="w-10 h-10 text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">¿Necesitas más ayuda?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Contacta a nuestro equipo de soporte para asistencia personalizada.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/soporte'}
                >
                  Ir a Soporte
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <CheckCircleIcon className="w-10 h-10 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">Primeros pasos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Eres nuevo? Revisa nuestra guía de configuración inicial.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/configuracion'}
                >
                  Configurar
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <RocketLaunchIcon className="w-10 h-10 text-purple-500 mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">Mejora tu plan</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Descubre funcionalidades avanzadas para hacer crecer tu negocio.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/suscripcion'}
                >
                  Ver planes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
