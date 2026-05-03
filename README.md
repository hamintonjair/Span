# Span Business - Sistema de Gestión Multi-Negocio

Plataforma SaaS completa y moderna para administración de negocios con sistema de suscripción por niveles, autenticación segura y módulos especializados.

## 🏗️ Arquitectura del Sistema

### Tecnologías Principales
- **Next.js 14** con App Router y Server Components
- **TypeScript** para tipado seguro y mantenibilidad
- **Tailwind CSS + shadcn/ui** para UI moderna y responsive
- **Supabase** como backend (Base de datos, Auth, Storage)
- **React 18** con hooks personalizados y estado optimizado

### Modelo de Negocio
Sistema de suscripción por niveles con acceso restringido según el plan:
- **Básico ($29.99)**: Agenda y ventas básicas
- **Profesional ($79.99)**: + Inventario y comisiones
- **Premium ($149.99)**: + Marketing y soporte prioritario

### 🚀 Características de Producción
- **Seguridad optimizada**: Sin fugas de datos en logs
- **Bundle optimizado**: Console.log eliminados automáticamente
- **Migraciones oficiales**: Sistema Supabase con formato timestamp
- **Código limpio**: Sin archivos de desarrollo ni duplicados

##  Estructura del Proyecto

```
src/
 app/                    # App Router de Next.js
  (auth)/           # Rutas de autenticación
  (dashboard)/       # Rutas protegidas del dashboard
   agenda/           # Gestión de citas y calendarización
   analytics/        # Análisis y métricas del negocio
   atencion/         # Punto de venta y atención al cliente
   auditoria/        # Sistema de auditoría de actividades
   ayuda/            # Centro de ayuda y documentación
   caja/             # Apertura/cierre de caja, préstamos
   categorias/       # Gestión de categorías de productos/servicios
   citas/            # Gestión de citas y calendarización
   clientes/         # Gestión de clientes
   configuracion/    # Configuración del sistema
   dashboard-empresa/ # Dashboard principal de empresa
   empleados/        # Gestión de empleados y comisiones
   finanzas-empresa/ # Finanzas y control de gastos
   inventario/       # Control de inventario (Premium)
   liquidacion-nomina/ # Liquidación de nóminas
   marketing/        # Módulo de marketing (Premium)
   mis-comisiones/   # Gestión personal de comisiones
   nomina/           # Gestión de nóminas y liquidaciones
   pos/              # Punto de venta terminal
   prestamos/        # Gestión de préstamos a empleados
   productos/        # Catálogo de productos
   proveedores/      # Gestión de proveedores
   servicios/        # Catálogo de servicios
   soporte/          # Centro de soporte técnico
   suscripcion/      # Gestión de suscripciones y planes
   suscripcion-expirada/ # Página de renovación
   upgrade/          # Página de upgrade de planes
   usuarios/         # Gestión de usuarios
   ventas/           # Registro de ventas
  admin/           # Panel de administrador global
   auditoria/      # Sistema de auditoría global
   centro-ayuda/   # Centro de ayuda y documentación
   comunicacion/   # Comunicaciones globales
   configuracion/  # Configuración global del sistema
   dashboard-admin/ # Dashboard principal admin global
   empresas/       # Gestión multi-empresa
   finanzas/       # Finanzas globales
   finanzas-empresa/ # Finanzas por empresa
   planes/         # Gestión de planes y suscripciones
   soporte/        # Panel de soporte global
   staff/          # Gestión de staff técnico
   suscripciones/  # Gestión de suscripciones globales
   usuarios/       # Gestión de usuarios globales
  api/             # Endpoints de la API REST
   admin/          # API del panel administrativo
   auth/           # Autenticación y usuarios
   cambiar-plan/   # Cambio de planes de suscripción
   clean-subscriptions/ # Limpieza de suscripciones
   comprobantes/   # Gestión de comprobantes de pago
   configuracion-global/ # Configuración global del sistema
   cron/           # Tareas programadas
   diagnostic/     # Diagnóstico del sistema
   empresas/       # API de empresas
   list-users/     # Listado de usuarios
   nominas/        # API de nóminas
   planes/         # API de planes y suscripciones
   setup-storage/  # Configuración de almacenamiento
   suscripciones/ # API de suscripciones
   update-empresa-plan/ # Actualización de planes de empresa
   upload/         # Subida de archivos
   usuarios/       # API de usuarios
  dashboard/        # Router central de dashboards
  login/            # Sistema de autenticación
  registro/         # Registro de nuevas empresas
  globals.css       # Estilos globales
  layout.tsx        # Layout principal de la app
  loading.tsx       # Componente de carga
  not-found.tsx     # Página 404 personalizada
  page.tsx          # Página principal de aterrizaje
 components/       # Componentes React reutilizables
  ProtectedRoute.tsx    # Protección de rutas por plan
  UpgradeRequired.tsx    # Página de upgrade de planes
  admin/              # Componentes del panel administrativo
    GraficosDashboard.tsx # Gráficos y métricas
  caja/               # Componentes de gestión de caja
    estado-caja.tsx    # Estado y control de caja
  layout/             # Layouts y navegación
    main-layout.tsx   # Layout principal del dashboard
    sidebar.tsx        # Navegación dinámica por rol
    simple-layout.tsx  # Layout simple
  modulos/            # Componentes de módulos
    modulos-components.tsx # Componentes reutilizables de módulos
  pos/                # Componentes de punto de venta
    terminal-pos-upgraded.tsx # Terminal POS mejorada
    terminal-pos.tsx   # Terminal POS básica
  prestamos/          # Componentes de préstamos
    panel-prestamos.tsx # Panel completo de préstamos
  subscription/       # Componentes de suscripciones
    SubscriptionGuard.tsx # Guardia de suscripciones
  ui/                 # Componentes base shadcn/ui
    badge.tsx          # Badges y etiquetas
    button.tsx         # Botones personalizados
    card.tsx           # Tarjetas y contenedores
    input.tsx          # Campos de entrada
    label.tsx          # Etiquetas de formularios
    logo.tsx           # Logo del sistema
    modal.tsx          # Ventanas modales
    textarea.tsx       # Áreas de texto
    toast.tsx          # Notificaciones toast
 hooks/            # Hooks personalizados
  use-cancelacion-automatica.ts # Cancelación automática de citas
  use-jwt-auth.ts  # Autenticación JWT personalizada
  use-suspension-automatica.ts # Suspensión automática de empresas
  usePlanPermissions.ts # Permisos por plan
 lib/              # Utilidades y configuración
  audit.ts         # Sistema de auditoría
  auditAdmin.ts    # Auditoría administrativa
  comisiones.ts    # Cálculo de comisiones
  jwt.ts           # Utilidades JWT
  mail-simple.ts   # Motor de correos simple
  mail.ts          # Motor de correos avanzado
  modulos-config.ts # Configuración de módulos
  modulos.ts       # Gestión de módulos
  subscriptions.ts # Gestión de suscripciones
  supabase/        # Configuración de Supabase
  supabase-admin.ts # Cliente administrativo Supabase
  supabase-client.ts # Cliente cliente Supabase
  supabase-server.ts # Cliente servidor Supabase
  utils.ts         # Utilidades generales
 services/         # Servicios de negocio
  caja.service.ts  # Servicios de gestión de caja
  email.service.ts # Motor de correos electrónicos
  index.ts         # Servicios principales
  nomina.service.ts # Servicios de nóminas
  utils.ts         # Utilidades de servicios
  ventas.service.ts # Servicios de ventas
 types/            # Definiciones TypeScript
  database.ts      # Tipos de base de datos
  supabase.ts      # Tipos de Supabase

🗄️ Base de Datos/
 supabase/         # Sistema oficial de migraciones Supabase
  migrations/      # Migraciones con formato timestamp
    20260218024518_create_configuracion_global.sql
    20260218024519_create_planes.sql
    20260218024520_update_empresas_table.sql
    20260218024521_create_suscripciones.sql
    20260218024522_create_comprobantes.sql
    20260218024523_create_logs_actividad.sql
    20260218024524_create_cajas.sql
    20260218024525_create_citas.sql
    20260218024526_create_ventas.sql
    20260218024527_create_empresas.sql
    20260218024528_create_nominas.sql
    20260218024529_create_clientes.sql
    20260218024530_create_empleados.sql
    20260218024531_create_prestamos.sql
    20260218024532_create_productos.sql
    20260218024533_create_servicios.sql
    20260218024534_create_categorias.sql
    20260218024535_create_comisiones.sql
    20260218024536_create_proveedores.sql
    20260218024537_create_cita_productos.sql
    20260218024538_create_detalles_ventas.sql
    20260218024539_create_pagos_prestamos.sql
    20260218024540_create_movimientos_caja.sql
    20260218024541_create_usuarios_sistema.sql
    20260218024542_create_campanas_marketing.sql
    20260218024543_create_movimientos_inventario.sql
    20260218024544_create_cita_servicios_adicionales.sql
    20260218024545_create_usuarios_staff.sql
    20260218024546_create_comunicacion.sql
    20260218024547_create_ayuda.sql
    20260218024548_create_tickets_soporte.sql
    20260218024549_create_logs_auditoria.sql
    20260218024550_create_mensajes_ticket.sql
    20260218024551_create_respaldos_datos.sql
  docs/             # Documentación técnica
  AGREGAR_NUEVO_MODULO.md # Guía para agregar módulos
  crear-bucket-logos.md # Configuración de storage

## 🚀 Instalación y Configuración

### 1. **Prerrequisitos**
- Node.js 18+ y npm
- Cuenta en Supabase
- Servicio de correo (Resend recomendado)

### 2. **Instalar Dependencias**
```bash
npm install
```

#### **Dependencias Adicionales**
Para funcionalidades específicas del sistema, se requieren las siguientes librerías:

**Exportación Excel y PDF**
```bash
npm install xlsx jspdf jspdf-autotable
```

**Iconos y UI**
```bash
npm install @heroicons/react lucide-react
```

**Utilidades**
```bash
npm install bcryptjs resend
```

**Testing (Nuevo)**
```bash
npm install --save-dev jest ts-jest @types/jest jest-environment-jsdom
```

---

## 🧪 Sistema de Testing

El proyecto incluye un **sistema completo de testing unitario** con **350 tests** para las **33 tablas** de la base de datos.

### **📊 Resumen de Tests**

| Tipo | Archivos | Tests | Estado |
|------|----------|-------|--------|
| Tests Manuales | 3 | 83 | ✅ Completos |
| Tests Generados | 30 | 267 | ✅ Automáticos |
| **TOTAL** | **33 tablas** | **350 tests** | **✅ 100%** |

### **📁 Estructura de Tests**

```
src/__tests__/
├── helpers/
│   ├── supabase-mock.ts      # Mock de Supabase
│   └── test-utils.ts          # Utilidades y datos de prueba
├── database/
│   ├── empresas.test.ts       # Tests manuales detallados
│   ├── usuarios-sistema.test.ts
│   ├── citas.test.ts
│   └── generated/             # 30 tests generados automáticamente
│       ├── configuracion-global.test.ts
│       ├── planes.test.ts
│       └── ... (todos los demás)
└── README.md                  # Documentación de testing
```

### **🚀 Comandos de Test**

```bash
npm test                    # Ejecutar todos los tests
npm run test:watch         # Modo watch (auto-reload)
npm run test:coverage      # Reporte de cobertura
npm run test:db            # Solo tests de base de datos
npm run test:ci            # Modo CI (para pipelines)
```

### **✅ Librerías de Testing Instaladas**

| Librería | Versión | Propósito |
|----------|---------|-----------|
| `jest` | 29.x | Framework de testing |
| `ts-jest` | 29.x | Soporte TypeScript para Jest |
| `@types/jest` | 29.x | Tipos TypeScript |
| `jest-environment-jsdom` | 29.x | Entorno DOM para tests |

### **🎯 Qué Validan los Tests**

- ✅ **Schema**: Estructura de tablas, columnas, tipos de datos
- ✅ **CRUD**: Insert, Select, Update, Delete
- ✅ **Constraints**: NOT NULL, UNIQUE, CHECK, Foreign Keys
- ✅ **Triggers**: Timestamps automáticos (updated_at)
- ✅ **Validaciones**: Errores, tipos de datos, lógica de negocio

### **🔄 Regenerar Tests**

Si agregas nuevas tablas o modificas la estructura:

```bash
node scripts/generate-tests.js
```

Esto regenera automáticamente los 30 tests basados en la configuración.

---

### 3. **Configurar Variables de Entorno**
Crea un archivo `.env.local` con:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Servicio de Correo
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@beautypro.com

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. **Configurar Base de Datos**
Ejecuta las migraciones en orden secuencial:

#### **Orden de Ejecución de Migraciones (33 archivos)**

**Fase 1: Sistema Base**
1. `20260218024518_create_configuracion_global.sql` - Configuración global del sistema
2. `20260218024519_create_planes.sql` - Planes de suscripción
3. `20260218024520_update_empresas_table.sql` - Actualización tabla empresas
4. `20260218024521_create_suscripciones.sql` - Suscripciones de empresas

**Fase 2: Sistema Financiero**
5. `20260218024522_create_comprobantes.sql` - Comprobantes de pago
6. `20260218024523_create_logs_actividad.sql` - Logs de actividad (usuarios)
7. `20260218024524_create_cajas.sql` - Gestión de cajas
8. `20260218024526_create_ventas.sql` - Registro de ventas
9. `20260218024527_create_empresas.sql` - Empresas del sistema
10. `20260218024528_create_nominas.sql` - Gestión de nóminas
11. `20260218024531_create_prestamos.sql` - Gestión de préstamos
12. `20260218024539_create_pagos_prestamos.sql` - Pagos de préstamos
13. `20260218024540_create_movimientos_caja.sql` - Movimientos de caja

**Fase 3: Gestión de Negocio**
14. `20260218024525_create_citas.sql` - Sistema de citas
15. `20260218024529_create_clientes.sql` - Gestión de clientes
16. `20260218024530_create_empleados.sql` - Gestión de empleados
17. `20260218024532_create_productos.sql` - Gestión de productos
18. `20260218024533_create_servicios.sql` - Gestión de servicios
19. `20260218024534_create_categorias.sql` - Categorización de servicios
20. `20260218024535_create_comisiones.sql` - Sistema de comisiones
21. `20260218024536_create_proveedores.sql` - Gestión de proveedores
22. `20260218024543_create_movimientos_inventario.sql` - Movimientos de inventario

**Fase 4: Tablas de Enlace**
23. `20260218024537_create_cita_productos.sql` - Enlace citas-productos
24. `20260218024538_create_detalles_ventas.sql` - Detalles de ventas
25. `20260218024544_create_cita_servicios_adicionales.sql` - Enlace citas-servicios adicionales

**Fase 5: Sistema Global**
26. `20260218024541_create_usuarios_sistema.sql` - Usuarios del sistema
27. `20260218024542_create_campanas_marketing.sql` - Campañas de marketing
28. `20260218024545_create_usuarios_staff.sql` - Usuarios staff global
29. `20260218024546_create_comunicacion.sql` - Comunicación global
30. `20260218024547_create_ayuda.sql` - Sistema de ayuda/soporte
31. `20260218024548_create_tickets_soporte.sql` - Tickets de soporte
32. `20260218024549_create_logs_auditoria.sql` - Logs de auditoría administrativa
33. `20260218024550_create_mensajes_ticket.sql` - Mensajes de tickets de soporte
34. `20260218024551_create_respaldos_datos.sql` - Sistema de respaldos

#### **Ejecución con Supabase CLI**
```bash
# Aplicar todas las migraciones en orden
supabase db push

# O aplicar migración por migración si es necesario
supabase db reset  # Reinicia y aplica todas
```

## 🎯 Características Principales

### 🔐 **Sistema de Seguridad**
- **Autenticación JWT** con Supabase
- **Middleware de protección** de rutas
- **Verificación de suscripción** automática
- **Bloqueo elegante** de módulos no disponibles
- **Row Level Security (RLS)** en base de datos

### 💼 **Módulos de Negocio**
- **📅 Agenda**: Citas y calendarización
- **💰 Punto de Venta**: Terminal POS completa
- **📦 Inventario**: Control de stock (Premium)
- **💵 Comisiones**: Sistema para empleados (Profesional+)
- **📢 Marketing**: Campañas promocionales (Premium)
- **📊 Reportes**: Análisis y métricas
- **⚙️ Configuración**: Administración del sistema
- **🛟 Soporte**: Tickets de soporte técnico y seguimiento de casos

### 🎨 **Diseño y UX**
- **Paleta dorada/negra** elegante y profesional
- **Sidebar dinámico** según rol de usuario
- **Diseño responsive** para todos los dispositivos
- **Componentes reutilizables** con shadcn/ui
- **Bloqueo visual** con iconos 🔒 en módulos restringidos

### 📧 **Motor de Notificaciones**
- **Correo de bienvenida** para nuevos salones
- **Recuperación de contraseña** segura
- **Recibos digitales** con diseño profesional
- **Notificaciones de suscripción** y vencimientos

## 🔄 Roles de Usuario

- **Admin Global**: Gestión multi-empresa, configuración global
- **Admin Empresa**: Finanzas, empleados, préstamos, caja
- **Recepcionista**: Caja, POS, citas, clientes
- **Estilista**: Agenda personal, comisiones, préstamos

## 🛠️ Scripts Disponibles

### **Desarrollo y Producción**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run build:fast   # Build optimizado sin lint
npm run start        # Servidor de producción
npm run lint         # Ejecutar ESLint
```

### **Testing**
```bash
npm test                    # Ejecutar todos los tests
npm run test:watch         # Modo watch (auto-reload)
npm run test:coverage      # Reporte de cobertura
npm run test:db            # Solo tests de base de datos
npm run test:ci            # Modo CI (para pipelines)
```

## 📋 Estado del Proyecto

### ✅ **Completamente Implementado**

####  Sistema Core
- ** Sistema de Autenticación**: Login JWT personalizado, registro, recuperación de contraseña
- ** Dashboard Multi-rol**: Dashboards específicos para admin global y empresas
- ** Sistema de Suscripciones**: Gestión completa de planes y pagos
- ** Auditoría Global**: Registro de actividades con trazabilidad completa
- ** Sistema de Soporte**: Tickets de soporte para empresas y administración global

####  Gestión de Negocio
- ** Gestión de Caja**: Apertura/cierre, control de efectivo, arqueo, préstamos
- ** Punto de Venta (POS)**: Terminal completa con carrito, cálculos automáticos
- ** Gestión de Citas**: Agenda completa, calendarización, estados, asignación
- ** Gestión de Clientes**: Registro completo, historial, búsqueda avanzada
- ** Gestión de Empleados**: Altas/bajas, comisiones, préstamos personales
- ** Gestión de Servicios**: Catálogo con precios, duración, categorías
- ** Gestión de Proveedores**: Catálogo completo, contactos, productos
- ** Gestión de Categorías**: Organización de productos y servicios

####  Finanzas y Control
- ** Finanzas**: Control de gastos, categorías, reportes
- ** Nóminas**: Generación, liquidaciones, cálculo de comisiones
- ** Préstamos**: Sistema completo con control de pagos y estados
- ** Inventario**: Control de stock, movimientos, ajustes, alertas
- ** Comprobantes**: Subida y gestión de comprobantes de pago

####  Sistema Global
- ** Admin Global**: Panel multi-empresa, configuración global
- ** Empresas**: Gestión multi-empresa, planes, estados
- ** Usuarios**: Gestión completa de usuarios y permisos
- ** Configuración**: Sistema de configuración global
- ** Ayuda**: Sistema integrado de ayuda y soporte

####  Características Técnicas
- ** UI/UX Profesional**: Diseño responsive con Tailwind + shadcn/ui
- ** Seguridad por Planes**: Bloqueo elegante de módulos según suscripción
- ** Motor de Correos**: Notificaciones automáticas con diseño profesional
- ** API REST**: Endpoints completos para todas las funcionalidades
- ** Base de Datos**: Estructura optimizada con migraciones y triggers

### 🚀 **Despliegue y Producción**
- **Build Optimizado**: `npm run build` elimina logs automáticamente
- **Variables de Entorno**: Configuración segura con `.env.local`
- **Migraciones**: Sistema oficial con formato timestamp
- **Seguridad**: Sin fugas de datos en console.error

### 🔧 **Características Técnicas**
- **⚡ Rendimiento**: Optimizado con Next.js 14 y React 18
- **🗄️ Base de Datos**: Supabase con RLS y migraciones oficiales
- **🔧 TypeScript**: Tipado seguro en todo el proyecto
- **🎨 Componentes**: Sistema de componentes reutilizables
- **🔄 Estado**: Gestión de estado con hooks personalizados
- **🧪 Testing**: 350 tests unitarios para 33 tablas con Jest

## 📚 Documentación

- **`docs/AGREGAR_NUEVO_MODULO.md`** - Guía para agregar nuevos módulos
- **`docs/crear-bucket-logos.md`** - Configuración de storage
- **`UI-README.md`** - Guía de componentes UI
- **`src/__tests__/README.md`** - Guía completa de testing

## 🏆 **Estado del Proyecto**

✅ **Producción Lista** - Sistema completamente optimizado y desplegable

### 🗄️ Sistema de Migraciones
- **`supabase/migrations/`** - Sistema oficial con formato timestamp
- **Migraciones automáticas** - Reconocidas por Supabase CLI
- **Base de datos optimizada** - Estructura limpia y eficiente
