# Span - Sistema de Gestión para Salones de Belleza

Plataforma SaaS completa para la administración de salones de belleza con sistema de suscripción por niveles, autenticación segura y módulos especializados.

## 🏗️ Arquitectura del Sistema

### Tecnologías Principales
- **Next.js 14** con App Router
- **TypeScript** para tipado seguro
- **Tailwind CSS + shadcn/ui** para UI moderna
- **Supabase** como backend (Base de datos, Auth, Storage)
- **React 18** con hooks personalizados

### Modelo de Negocio
Sistema de suscripción por niveles con acceso restringido según el plan:
- **Básico ($29.99)**: Agenda y ventas básicas
- **Profesional ($79.99)**: + Inventario y comisiones
- **Premium ($149.99)**: + Marketing y soporte prioritario

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (dashboard)/       # Rutas protegidas del dashboard
│   │   ├── suscripcion/   # Gestión de suscripciones
│   │   ├── planes/        # Planes y precios
│   │   ├── inventario/    # Control de inventario (Premium)
│   │   ├── comisiones/    # Sistema de comisiones (Profesional+)
│   │   └── marketing/     # Módulo de marketing (Premium)
│   ├── api/               # Endpoints de la API REST
│   ├── login/             # Sistema de autenticación
│   ├── bloqueo-pago/      # Página de bloqueo por suscripción
│   └── admin-global/      # Panel de administrador global
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes base shadcn/ui
│   ├── layout/           # Layouts y navegación
│   ├── ProtectedRoute.tsx # Protección de rutas por permisos
│   └── UpgradeRequired.tsx # Página de upselling
├── hooks/                # Hooks personalizados
│   ├── use-jwt-auth.ts   # Autenticación JWT
│   └── usePlanPermissions.ts # Permisos por plan
├── lib/                  # Utilidades y configuración
│   └── supabase.ts      # Cliente de Supabase
├── services/             # Servicios de negocio
│   └── email.service.ts  # Motor de correos electrónicos
└── types/                # Definiciones TypeScript
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

### ✅ **Implementado**
- Sistema completo de suscripción
- Autenticación y seguridad
- UI/UX profesional
- Motor de correos electrónicos
- Protección de módulos por plan
- Base de datos estructurada

### 🚧 **En Desarrollo**
- Dashboard de administrador global
- Módulo de marketing avanzado
- Integración con pasarelas de pago
- Reportes analíticos

## 📚 Documentación Adicional

- `FASE4-README.md` - Motor de correos y seguridad
- `SISTEMA_MODULOS_PREMIUM.md` - Sistema de restricción por plan
- `UI-README.md` - Guía de componentes y diseño
- `instrucciones-supabase.md` - Configuración de base de datos
