'use client';

import { useState, useEffect } from 'react';
import { ScaleIcon, ArrowLeftIcon, ShieldCheckIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PaginaLegal {
  id: string;
  slug: string;
  titulo: string;
  contenido: string;
  actualizado_en: string;
}

const FALLBACK_TERMINOS = `# Términos y Condiciones de Uso del Servicio

Bienvenido a **Span Business** (en adelante la "Plataforma" o "Span"). Los presentes Términos y Condiciones regulan el acceso, suscripción y uso de la plataforma digital de gestión integral alojada en **span-business.com**, administrada por Span Business (NIT 80772379-9).

Al crear una cuenta, acceder o utilizar la Plataforma, usted declara ser mayor de edad, contar con la debida facultad jurídica para representar a su establecimiento comercial, y acepta expresamente estos Términos y Condiciones.

---

### 1. Descripción de los Servicios

Span Business es una solución integral en la nube diseñada específicamente para la optimización de negocios en el sector de la belleza y estética:

* **Punto de Venta (POS):** Facturación ágil, control de ventas diarias, emisión de tickets y comprobantes térmicos.
* **Control de Cajas:** Apertura, arqueos, cierres diarios de turno y reportes automáticos por correo electrónico.
* **Agenda y Gestión de Citas:** Programación interactiva de turnos por estilista o barbero, control de citas pendientes y cancelaciones automáticas.
* **Gestión de Colaboradores y Comisiones:** Configuración de esquemas porcentuales por servicio y producto, liquidación automática de nóminas y control de préstamos laborales internos.
* **Control de Inventarios:** Kardex de entradas/salidas, alertas de stock mínimo y catálogo de proveedores.
* **Módulos de Marketing y Analytics:** Métricas de rendimiento, reportes financieros y fidelización de clientes.

---

### 2. Registro, Credenciales y Seguridad

1. **Veracidad de la Información:** El usuario se compromete a registrar información veraz, completa y actualizada sobre su negocio.
2. **Custodia de Credenciales:** La contraseña y el token de acceso son estrictamente personales e intransferibles. El usuario es responsable de la confidencialidad de sus credenciales.
3. **Notificación de Incidentes:** En caso de detectar cualquier uso no autorizado de su cuenta o brecha de seguridad, el usuario deberá notificar de inmediato a \`soporte@span-business.com\`.

---

### 3. Planes de Suscripción, Precios y Prueba Gratuita

#### 3.1 Período de Prueba Gratuita (15 Días)
* Span Business ofrece un **período de prueba gratuito de quince (15) días calendario** para que los nuevos salones exploren la funcionalidad completa del sistema.
* **Sin tarjeta de crédito requerida:** No se exige ingresar medios de pago para iniciar la prueba.
* **Sin cobros automáticos sorpresivos:** Al finalizar los 15 días, la cuenta no genera débitos automáticos. El usuario decide libremente si adquiere un plan activo mediante transferencia bancaria o pasarela de pago autorizada.
* Si el usuario decide no contratar un plan, el acceso a las funciones operativas se pausará conservando la información durante el tiempo prudencial estipulado en las políticas de retención.

#### 3.2 Moneda y Modalidad de Pago
* Todos los precios expuestos en la Plataforma están expresados en **Pesos Colombianos (COP)** e incluyen los impuestos de ley aplicables, salvo indicación expresa en contrario.
* Las suscripciones se liquidan de manera mensual o anual anticipada según el plan seleccionado (Básico, Profesional, Empresarial).
* El registro de comprobantes de pago de suscripción se realiza de forma directa en el módulo administrativo y pasa por una verificación rápida para su activación.

#### 3.3 Cancelación y Reembolsos
* El usuario puede cancelar o solicitar la no renovación de su plan en cualquier momento sin penalizaciones ni cláusulas de permanencia forzosa.
* Debido a la naturaleza del servicio en la nube y la disponibilidad inmediata de los recursos tecnológicos, los pagos correspondientes al mes ya cursado no son reembolsables, garantizándose el servicio hasta el último día del ciclo pagado.

---

### 4. Responsabilidades y Obligaciones del Usuario

El usuario se compromete expresamente a:
* Utilizar la Plataforma exclusivamente para fines lícitos y vinculados a la actividad comercial de su salón, barbería, spa o centro estético.
* Contar con la debida autorización de sus colaboradores y clientes finales para el almacenamiento de sus datos conforme a la legislación de Habeas Data vigente.
* No realizar prácticas de ingeniería inversa, descompilación, vulneración de seguridad o sobrecarga intencional de la infraestructura de Span Business.

---

### 5. Propiedad Intelectual

Todo el software, código fuente, interfaces gráficas, logotipos, marcas comerciales ("Span", "Span Business") y documentación son de propiedad exclusiva de Span Business. La contratación de un plan concede únicamente una **licencia de uso temporal, revocable, no exclusiva e intransferible** para la operación del negocio afiliado durante la vigencia de la suscripción.

---

### 6. Disponibilidad del Servicio y Garantías

1. **Uptime Garantizado:** Span Business opera sobre infraestructura en la nube de alta disponibilidad, procurando un nivel de servicio del 99.9% de operatividad continua.
2. **Mantenimiento Programado:** Span Business podrá realizar mantenimientos de actualización técnica, procurando ejecutarlos en horarios de bajo impacto para la operación de los salones.
3. **Limitación de Responsabilidad:** Span Business no será responsable por interrupciones atribuibles a fallas en el proveedor de internet del usuario, cortes de energía locales, uso indebido del sistema o causas de fuerza mayor.

---

### 7. Suspensión y Terminación del Servicio

Span Business se reserva el derecho de suspender temporalmente o cancelar de manera definitiva el acceso a la Plataforma en los siguientes eventos:
* Incumplimiento prolongado en el pago de la suscripción mensual tras los avisos preventivos de vencimiento.
* Uso de la plataforma para fines ilícitos, fraudulentos o contrarios al orden público.
* Vulneración manifiesta de los derechos de propiedad intelectual de la Plataforma.

---

### 8. Ley Aplicable y Jurisdicción

Los presentes Términos y Condiciones se regirán e interpretarán de conformidad con las leyes de la **República de Colombia**. Cualquier controversia que no pueda resolverse de mutuo acuerdo será sometida a los jueces competentes de la jurisdicción colombiana.

---

### 9. Canales Oficiales de Contacto

Para inquietudes, soporte técnico o notificaciones formales:
* **Correo Electrónico Oficial:** soporte@span-business.com
* **WhatsApp de Asistencia:** +57 312 494 35 27
* **Horario de Atención:** Lunes a Viernes de 8:00 AM a 5:00 PM | Sábados de 9:00 AM a 1:00 PM (Hora de Colombia)

*Fecha de última actualización: Noviembre de 2026. Span Business - Todos los derechos reservados.*`;

export default function TerminosPage() {
  const [pagina, setPagina] = useState<PaginaLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  useEffect(() => {
    cargarPaginaTerminos();
  }, []);

  const cargarPaginaTerminos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/paginas-legales');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const paginaTerminos = result.data.find((p: PaginaLegal) => p.slug === 'terminos');
          if (paginaTerminos && paginaTerminos.contenido && paginaTerminos.contenido.trim().length > 50) {
            setPagina(paginaTerminos);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Usando contenido de términos predeterminado:', err);
    } finally {
      setLoading(false);
    }
  };

  const contenidoFinal = pagina?.contenido && pagina.contenido.trim().length > 50 
    ? pagina.contenido 
    : FALLBACK_TERMINOS;

  const renderContent = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-10 sm:px-10 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
            <ScaleIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {pagina?.titulo || 'Términos y Condiciones del Servicio'}
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base max-w-2xl mx-auto">
            Condiciones claras, transparentes y justas para la suscripción y uso de la suite Span Business en salones, barberías y spas.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-300">
            <span className="flex items-center gap-1">
              <DocumentCheckIcon className="w-4 h-4 text-green-400" /> 15 Días de Prueba Gratis
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheckIcon className="w-4 h-4 text-green-400" /> Sin permanencia forzosa
            </span>
            <span>•</span>
            <span>Precios en Pesos Colombianos (COP)</span>
          </div>
        </div>
      </div>

      {/* Contenido en Markdown con estilos optimizados */}
      <div className="px-6 py-10 sm:px-12 bg-white text-slate-800">
        <article className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-3 mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mt-6 mb-2" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-base font-bold text-slate-900 mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="text-slate-700 leading-relaxed mb-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-4 text-slate-700" {...props} />,
              li: ({ node, ...props }) => <li className="text-slate-700 leading-relaxed" {...props} />,
              hr: ({ node, ...props }) => <hr className="my-8 border-slate-200" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
              a: ({ node, ...props }) => <a className="text-indigo-600 hover:text-indigo-800 underline font-medium" {...props} />
            }}
          >
            {contenidoFinal}
          </ReactMarkdown>
        </article>

        {/* Caja de ayuda */}
        <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">¿Tienes dudas sobre los planes o términos?</h4>
            <p className="text-sm text-slate-600">Nuestro equipo comercial y de soporte está disponible para asesorarte en la configuración de tu salón.</p>
          </div>
          <Link
            href="/contacto"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition-colors whitespace-nowrap"
          >
            Contactar a Soporte
          </Link>
        </div>
      </div>
    </div>
  );

  if (isDashboard) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ScaleIcon className="w-7 h-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
              <p className="text-sm text-gray-500">Condiciones de contratación y uso del software Span Business</p>
            </div>
          </div>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Público */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Volver al Inicio">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="object-contain">
                    <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                    <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                    <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                    <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                    <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">Span Business</span>
                  <span className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block">Software para Salones y Spas</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/#faq" className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2">
                Preguntas Frecuentes
              </Link>
              <Link href="/contacto" className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2">
                Contacto
              </Link>
              <Link href="/login" className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-11 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-900 font-medium">Términos y Condiciones</span>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        {renderContent()}
      </main>

      {/* Footer Unificado */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#1f2937"/>
                <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
                <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
                <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
                <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Span Business</span>
          </div>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
            Plataforma integral de gestión en la nube para Salones de Belleza, Peluquerías, Barberías y Spas.
          </p>
          <div className="flex justify-center flex-wrap gap-6 text-sm text-slate-400 mb-6">
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors underline">Términos y Condiciones</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link>
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto y Soporte</Link>
            <a href="mailto:soporte@span-business.com" className="hover:text-white transition-colors">soporte@span-business.com</a>
          </div>
          <div className="text-xs text-slate-500">
            © 2026 Span Business. Todos los derechos reservados. Nit: 80772379-9. Quibdó - Chocó, Colombia.
          </div>
        </div>
      </footer>
    </div>
  );
}
