# Sistema de Restricción de Módulos por Plan

Este sistema implementa un "bloqueo elegante" para los módulos Premium según el plan de suscripción del usuario.

## 🏗️ Arquitectura del Sistema

### 1. Hook de Permisos (`usePlanPermissions.ts`)
- Consulta los datos de la tabla `empresa` y `planes`
- Devuelve booleanos de permisos: `canUseInventory`, `canUseCommissions`, `canUseMarketing`
- Determina permisos según el precio del plan:
  - **Básico ($29.99)**: Solo Agenda y Ventas
  - **Profesional ($79.99)**: + Inventario y Comisiones
  - **Premium ($149.99)**: + Marketing y Soporte Prioritario

### 2. Componente de Protección (`ProtectedRoute.tsx`)
- Envuelve las páginas restringidas
- Verifica permisos antes de mostrar el contenido
- Muestra `UpgradeRequired` si no tiene permisos

### 3. Página de Upselling (`UpgradeRequired.tsx`)
- Diseño atractivo y motivador
- Muestra beneficios del módulo
- Ofrece upgrade directo a `/suscripcion`
- Incluye información del plan requerido

### 4. Sidebar Modificado
- Muestra icono de candado 🔒 en módulos restringidos
- No oculta el acceso, solo indica restricción
- Permite navegar para ver la página de upgrade

## 📁 Estructura de Archivos

```
src/
├── hooks/
│   └── usePlanPermissions.ts          # Hook de permisos
├── components/
│   ├── ProtectedRoute.tsx             # Componente de protección
│   ├── UpgradeRequired.tsx            # Página de upselling
│   └── layout/
│       └── sidebar.tsx                # Sidebar con iconos de candado
└── app/(dashboard)/
    ├── inventario/page.tsx             # Página protegida (Inventario)
    ├── comisiones/page.tsx             # Página protegida (Comisiones)
    └── marketing/page.tsx              # Página protegida (Marketing)
```

## 🚀 Cómo Usar

### 1. Proteger una Página
```tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function MiModuloPage() {
  return (
    <ProtectedRoute
      requiredPermission="inventory"  // 'inventory' | 'commissions' | 'marketing'
      moduleInfo={{
        name: 'Inventario',
        icon: '📦',
        benefits: [
          'Controla tu stock en tiempo real',
          'Evita pérdidas por falta de productos',
          // ... más beneficios
        ],
        requiredPlan: 'Profesional',
        upgradePrice: 79.99
      }}
    >
      {/* Tu contenido de la página */}
    </ProtectedRoute>
  );
}
```

### 2. Agregar Módulo al Sidebar
```tsx
{
  title: 'Inventario',
  href: '/inventario',
  icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
  roles: ['dueño', 'admin_empresa'],
  section: 'main',
  requiresPermission: 'inventory'  // Propiedad clave
}
```

### 3. Usar el Hook de Permisos
```tsx
import { usePlanPermissions } from '@/hooks/usePlanPermissions';

function MiComponente() {
  const { canUseInventory, canUseCommissions, canUseMarketing, planName, loading } = usePlanPermissions();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      {canUseInventory && <button>Gestionar Inventario</button>}
      {canUseCommissions && <button>Ver Comisiones</button>}
      {canUseMarketing && <button>Campañas de Marketing</button>}
    </div>
  );
}
```

## 🎨 Características del Sistema

### ✅ Bloqueo Elegante
- No oculta funcionalidades, solo indica restricción
- Iconos de candado visuales en el sidebar
- Página de upgrade motivadora y profesional

### ✅ Experiencia de Usuario
- Mensajes claros sobre beneficios
- Llamadas a la acción directas
- Diseño atractivo y consistente

### ✅ Lógica Flexible
- Basada en precio del plan (no en nombre)
- Fácil de agregar nuevos módulos
- Configurable y extensible

### ✅ Protección Completa
- Verificación en cliente y servidor
- Redirección automática a upgrade
- Mantenimiento de estado de navegación

## 🔧 Configuración de Planes

La lógica de permisos está basada en el precio del plan:

```typescript
// Plan Básico ($29.99): Solo Agenda y Ventas
if (planPrecio >= 29.99) {
  canUseInventory = false;
  canUseCommissions = false;
  canUseMarketing = false;
}

// Plan Profesional ($79.99): + Inventario y Comisiones
if (planPrecio >= 79.99) {
  canUseInventory = true;
  canUseCommissions = true;
  canUseMarketing = false;
}

// Plan Premium ($149.99): + Marketing y Soporte Prioritario
if (planPrecio >= 149.99) {
  canUseInventory = true;
  canUseCommissions = true;
  canUseMarketing = true;
  hasPrioritySupport = true;
}
```

## 📈 Beneficios del Sistema

1. **Conversión**: Motiva a los usuarios a upgrade
2. **Claridad**: Los usuarios saben exactamente qué obtienen
3. **Profesionalismo**: Diseño pulido y corporativo
4. **Flexibilidad**: Fácil de mantener y extender
5. **Seguridad**: Protección completa de módulos restringidos

## 🔄 Flujo del Usuario

1. **Usuario con plan básico** ve iconos 🔒 en Inventario, Comisiones, Marketing
2. **Al hacer clic** en un módulo restringido, ve página de upgrade
3. **Página de upgrade** muestra beneficios y botón para mejorar plan
4. **Después del upgrade**, el usuario accede al módulo normalmente

Este sistema crea una experiencia positiva que incentiva el upgrade mientras mantiene la funcionalidad visible y atractiva.
