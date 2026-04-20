# BeautyPro SaaS - Sistema de Gestión para Salones de Belleza

Plataforma SaaS completa y moderna para la administración de salones de belleza con sistema de suscripción por niveles, autenticación segura y módulos especializados.

##  Arquitectura del Sistema

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

##  Estructura del Proyecto

```
src/
 app/                    # App Router de Next.js
  (dashboard)/       # Rutas protegidas del dashboard
   agenda/         # Gestión de citas y calendarización
   caja/           # Apertura/cierre de caja, préstamos
   clientes/       # Gestión de clientes
   empleados/      # Gestión de empleados y comisiones
   empresas/       # Configuración de la empresa
   finanzas/       # Control de gastos y nominas
   inventario/    # Control de inventario (Premium)
   nominas/        # Gestión de nóminas y liquidaciones
   pos/            # Punto de venta terminal
   proveedores/    # Gestión de proveedores
   servicios/      # Catálogo de servicios
   suscripcion/    # Gestión de suscripciones y planes
   dashboard-empresa/ # Dashboard principal de empresa
   ayuda/          # Sistema de ayuda y soporte
   configuracion/  # Configuración del sistema
  admin/           # Panel de administrador global
   dashboard-admin/ # Dashboard principal admin global
   auditoria/      # Sistema de auditoría global
   empresas/       # Gestión multi-empresa
  api/             # Endpoints de la API REST
   auth/           # Autenticación y usuarios
   citas/          # Gestión de citas
   comprobantes/   # Gestión de comprobantes de pago
   empresas/       # API de empresas
   finanzas/       # API de finanzas
   nominas/        # API de nóminas
   usuarios/       # API de usuarios
  login/           # Sistema de autenticación
  dashboard/       # Router central de dashboards
 components/       # Componentes React reutilizables
  ui/              # Componentes base shadcn/ui
  layout/          # Layouts y navegación
    sidebar.tsx    # Navegación dinámica por rol
  forms/           # Formularios reutilizables
  modals/          # Ventanas modales
  tables/          # Tablas de datos
 hooks/            # Hooks personalizados
  use-jwt-auth.ts  # Autenticación JWT personalizada
  usePlanPermissions.ts # Permisos por plan
 lib/              # Utilidades y configuración
  supabase.ts      # Cliente de Supabase
  audit.ts         # Sistema de auditoría
 services/         # Servicios de negocio
  email.service.ts # Motor de correos electrónicos
 types/            # Definiciones TypeScript

Base de Datos/
 database/         # Scripts de base de datos
  queries/         # Consultas de diagnóstico
  triggers/        # Triggers automáticos
 migrations/       # Migraciones de estructura
 database-migrations/ # Migraciones adicionales
 sql_fix/          # Fixes y mejoras SQL
```

## 🚀 Instalación y Configuración

### 1. **Prerrequisitos**
- Node.js 18+ y npm
- Cuenta en Supabase
- Servicio de correo (Resend recomendado)

### 2. **Instalar Dependencias**
```bash
npm install
```

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
Ejecuta los scripts SQL en orden:
1. `database/usuarios_sistema.sql` - Tablas base
2. `supabase-simple.sql` - Estructura completa
3. `database-migrations/` - Migraciones adicionales

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

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Ejecutar ESLint
```

## 📋 Estado del Proyecto

### ✅ **Completamente Implementado**

####  Sistema Core
- ** Sistema de Autenticación**: Login JWT personalizado, registro, recuperación de contraseña
- ** Dashboard Multi-rol**: Dashboards específicos para admin global y empresas
- ** Sistema de Suscripciones**: Gestión completa de planes y pagos
- ** Auditoría Global**: Registro de actividades con trazabilidad completa

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

###  **Próximas Mejoras**
- ** Marketing Avanzado**: Campañas promocionales y newsletters
- ** Pasarelas de Pago**: Integración con Stripe/Mercado Pago
- ** Reportes Analíticos**: Métricas avanzadas y dashboards BI
- ** App Móvil**: Versión móvil nativa (React Native)
- ** Integraciones**: API para terceros y webhooks

### 🔧 **Características Técnicas**
- **⚡ Rendimiento**: Optimizado con Next.js 14 y React 18
- **🗄️ Base de Datos**: Supabase con RLS y migraciones
- **🔧 TypeScript**: Tipado seguro en todo el proyecto
- **🎨 Componentes**: Sistema de componentes reutilizables
- **🔄 Estado**: Gestión de estado con hooks personalizados

## 📚 Documentación Adicional

- `README.md` - Documentación principal del proyecto
- `INSTRUCCIONES_USUARIOS.md` - Guía de configuración para usuarios
- `SISTEMA_MODULOS_PREMIUM.md` - Sistema de restricción por plan
- `UI-README.md` - Guía de componentes y diseño
- `shadcn-setup.md` - Configuración de componentes shadcn/ui

##  Estructura de Base de Datos

### Scripts SQL Principales
- `supabase-simple.sql` - Esquema completo de la base de datos
- `add_plan_modules_columns.sql` - Estructura de módulos por plan
- `update_planes_benefits.sql` - Configuración de planes y beneficios
- `fix-admin-access.sql` - Creación de usuario administrador global

### Migraciones y Fixes
- `migrations/` - Migraciones esenciales del sistema
- `database-migrations/` - Migraciones adicionales y configuración
- `sql_fix/` - Fixes críticos y mejoras SQL
- `database/` - Scripts de tablas y estructura completa
