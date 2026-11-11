'use client';

import { useState, useEffect } from 'react';
import { ShieldCheckIcon, ArrowLeftIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
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

const FALLBACK_PRIVACIDAD = `# Política de Tratamiento de Datos Personales y Privacidad

**Span Business** (en adelante la "Plataforma" o "Span"), en cumplimiento de la **Ley Estatutaria 1581 de 2012**, el **Decreto Reglamentario 1377 de 2013** de la República de Colombia y los estándares internacionales aplicables en materia de protección de datos personales, informa a sus usuarios, empresas afiliadas y público en general la presente Política de Privacidad.

---

### 1. Identificación del Responsable del Tratamiento

* **Nombre Comercial / Marca:** Span Business
* **NIT / Identificación:** 80772379-9
* **Domicilio Principal:** Carrera 12 # 43 - 136, Quibdó - Chocó, Colombia
* **Correo Electrónico Oficial de Privacidad y Soporte:** soporte@span-business.com
* **Línea de Atención / WhatsApp Oficial:** +57 312 494 35 27
* **Sitio Web Oficial:** https://span-business.com

---

### 2. Alcance y Objeto del Servicio

Span Business es una solución integral de software como servicio (**SaaS**) especializada en la administración y optimización de **Salones de Belleza, Peluquerías, Barberías, Spas, Centros de Estética y Profesionales del Cuidado Personal**. 

Al registrar una cuenta y utilizar los módulos de agenda, punto de venta (POS), inventario, comisiones o nóminas, el usuario acepta de manera previa, expresa e informada el tratamiento de sus datos conforme a los términos descritos en este documento.

---

### 3. Categorías de Datos Recopilados

La Plataforma recopila y almacena únicamente la información indispensable para prestar y facturar los servicios contratados:

#### A. Datos del Establecimiento y Administrador
* Razón social, nombre comercial del salón o barbería, NIT o documento de identidad.
* Nombre completo, correo electrónico y número de teléfono/WhatsApp del titular.
* Dirección física de las sedes o sucursales, ciudad y datos de facturación.
* Comprobantes de pago de suscripciones y transacciones de activación.

#### B. Datos del Personal y Colaboradores (Estilistas, Barberos, Recepcionistas)
* Nombre completo, datos de contacto y rol operativo dentro del sistema.
* Esquemas de comisiones pactados (porcentajes por servicio o venta de productos).
* Registro de anticipos, préstamos internos y liquidaciones periódicas de comisiones.

#### C. Datos de Clientes Finales del Salón (Ingresados por la Empresa Afiliada)
* Nombre, teléfono o WhatsApp y correo electrónico para confirmación de turnos.
* Historial de citas agendadas, fechas, servicios recibidos y notas técnicas de atención.

#### D. Datos Técnicos y Registros de Auditoría
* Trazabilidad de accesos (logs de auditoría), fecha, hora y dirección IP para garantizar la seguridad informática y prevenir accesos no autorizados.

---

### 4. Finalidades del Tratamiento

Los datos personales son tratados con las siguientes finalidades legítimas:

1. **Gestión Operativa:** Permitir la autenticación segura, control de permisos por roles y uso de los módulos del software.
2. **Programación y Citas:** Organizar la agenda diaria de turnos y sincronizar la disponibilidad de cada profesional del salón.
3. **Punto de Venta y Control de Caja:** Emitir comprobantes de venta, registrar ingresos/egresos y generar cierres diarios automáticos de turno.
4. **Liquidación de Comisiones y Préstamos:** Calcular las comisiones correspondientes a cada estilista o barbero y administrar deducciones autorizadas.
5. **Comunicaciones y Soporte:** Enviar notificaciones de servicio, confirmaciones de activación de plan y brindar asistencia técnica especializada.
6. **Seguridad y Auditoría:** Proteger la integridad de la base de datos y cumplir con los requerimientos contables y fiscales exigidos por la ley.

---

### 5. Rol de Span Business como Encargado del Tratamiento

Respecto a la información de los **clientes finales** ingresada por cada salón, el establecimiento actúa como **Responsable del Tratamiento** y Span Business interviene únicamente como **Encargado del Tratamiento**. Span Business no comercializa, no vende ni comparte los datos de los clientes de sus afiliados con terceros bajo ninguna circunstancia.

---

### 6. Medidas de Seguridad y Encriptación

Implementamos estándares técnicos de alta seguridad:
* **Cifrado de Contraseñas:** Algoritmos criptográficos unidireccionales (bcrypt) con salt aleatorio.
* **Autenticación Protegida:** Tokens JWT firmados criptográficamente y cookies bajo protocolo seguro HTTPS con directiva SameSite.
* **Aislamiento Multi-Tenant:** Separación estricta de bases de datos por identificador de empresa (\`empresa_id\`), impidiendo el acceso cruzado entre establecimientos.
* **Respaldos Periódicos:** Copias de seguridad automáticas en la nube para garantizar la disponibilidad continua.

---

### 7. Derechos del Titular (Habeas Data)

De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:
* Conocer, actualizar y rectificar sus datos personales en cualquier momento.
* Solicitar prueba de la autorización otorgada.
* Ser informado sobre el uso específico que se le ha dado a sus datos.
* Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).
* Revocar la autorización o solicitar la supresión de datos cuando proceda conforme a la ley.

---

### 8. Canal de Atención de Privacidad y PQRS

Para ejercer sus derechos de Habeas Data o realizar consultas sobre privacidad, comuníquese con nuestro equipo:
* **Correo Electrónico:** soporte@span-business.com (Asunto: *Protección de Datos Personales*)
* **WhatsApp de Asistencia:** +57 312 494 35 27
* **Tiempo de Respuesta:** Consultas en un máximo de diez (10) días hábiles; reclamos en quince (15) días hábiles.

---

*Fecha de última actualización: Noviembre de 2026. Span Business - Todos los derechos reservados.*`;

export default function PrivacidadPage() {
  const [pagina, setPagina] = useState<PaginaLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();
  
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isEmpresa = pathname.includes('empresa');

  useEffect(() => {
    cargarPaginaPrivacidad();
  }, []);

  const cargarPaginaPrivacidad = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/paginas-legales');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const paginaPrivacidad = result.data.find((p: PaginaLegal) => p.slug === 'privacidad');
          if (paginaPrivacidad && paginaPrivacidad.contenido && paginaPrivacidad.contenido.trim().length > 50) {
            setPagina(paginaPrivacidad);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Usando contenido de privacidad optimizado predeterminado:', err);
    } finally {
      setLoading(false);
    }
  };

  const contenidoFinal = pagina?.contenido && pagina.contenido.trim().length > 50 
    ? pagina.contenido 
    : FALLBACK_PRIVACIDAD;

  const renderContent = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-10 sm:px-10 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {pagina?.titulo || 'Política de Privacidad y Tratamiento de Datos'}
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base max-w-2xl mx-auto">
            Protegemos la información de tu salón, equipo y clientes con rigurosos estándares de seguridad y cumplimiento legal bajo la Ley 1581 de 2012.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-300">
            <span className="flex items-center gap-1">
              <CheckBadgeIcon className="w-4 h-4 text-green-400" /> Datos Encriptados SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <LockClosedIcon className="w-4 h-4 text-green-400" /> Acceso Restringido y Seguro
            </span>
            <span>•</span>
            <span>Vigencia: Noviembre 2026</span>
          </div>
        </div>
      </div>

      {/* Contenido en Markdown con estilos optimizados */}
      <div className="px-6 py-10 sm:px-12 bg-white text-slate-800">
        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-strong:text-slate-900">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-3 mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mt-6 mb-2 flex items-center gap-2" {...props} />,
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

        {/* Caja de ayuda de privacidad */}
        <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">¿Tienes dudas sobre el tratamiento de tus datos?</h4>
            <p className="text-sm text-slate-600">Escríbenos a nuestro canal oficial de soporte para atender cualquier inquietud o solicitud de Habeas Data.</p>
          </div>
          <a
            href="mailto:soporte@span-business.com?subject=Consulta%20sobre%20Privacidad%20Span%20Business"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition-colors whitespace-nowrap"
          >
            soporte@span-business.com
          </a>
        </div>
      </div>
    </div>
  );

  if (isDashboard) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-7 h-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Política de Privacidad</h1>
              <p className="text-sm text-gray-500">Términos legales y tratamiento de información en Span Business</p>
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
            <span className="text-slate-900 font-medium">Política de Privacidad</span>
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
            <Link href="/privacidad" className="hover:text-white transition-colors underline">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
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
