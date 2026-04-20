# 📋 Guía para Agregar Nuevos Módulos al Sistema

## 🎯 Resumen

El sistema ahora es **completamente dinámico**. Para agregar un nuevo módulo solo necesitas seguir 3 pasos simples. No hay que modificar lógica de precios ni código complejo.

---

## 📝️ Paso 1: Base de Datos

Agrega una nueva columna a la tabla `planes`:

```sql
ALTER TABLE planes 
ADD COLUMN tiene_nuevo_modulo BOOLEAN DEFAULT FALSE;
```

Luego actualiza los planes existentes según corresponda:

```sql
-- Plan Profesional: Activar módulo
UPDATE planes 
SET tiene_nuevo_modulo = TRUE
WHERE precio >= 79.99 OR nombre ILIKE '%profesional%';

-- Plan Empresarial: Activar módulo  
UPDATE planes 
SET tiene_nuevo_modulo = TRUE
WHERE precio >= 199.99 OR nombre ILIKE '%empresarial%';
```

---

## ⚙️ Paso 2: Configuración del Módulo

Edita `src/lib/modulos-config.ts` y agrega tu módulo al array `MODULES_CONFIG`:

```typescript
{
  key: 'analytics',           // Identificador único
  nombre: 'Analytics',         // Nombre visible
  icon: '📊',              // Icono para UI
  descripcion: 'Análisis avanzado de datos', // Descripción
  campoBD: 'tiene_analytics', // Campo en tabla planes
  permissionKey: 'canUseAnalytics', // Propiedad en PlanPermissions
  categoria: 'enterprise'    // Categoría del módulo
}
```

### Categorías Disponibles:
- `'core'`: Módulos básicos (siempre disponibles)
- `'premium'`: Para plan Profesional+
- `'enterprise'`: Para plan Empresarial+

---

## 🎯 Paso 3: Usar el Módulo

### En Rutas Protegidas:

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute
      requiredPermission="analytics"  // Usa el 'key' del módulo
      moduleInfo={{
        name: 'Analytics',
        icon: '📊',
        benefits: [
          'Dashboard en tiempo real',
          'Reportes personalizados',
          'Exportación de datos'
        ],
        requiredPlan: 'Empresarial', // Opcional
        upgradePrice: 199.99       // Opcional
      }}
    >
      {/* Tu contenido aquí */}
    </ProtectedRoute>
  );
}
```

### En Componentes:

```tsx
import { usePlanPermissions } from '@/hooks/usePlanPermissions';

export default function MiComponente() {
  const { canUseAnalytics, loading } = usePlanPermissions();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {canUseAnalytics ? (
        <div>Contenido de Analytics</div>
      ) : (
        <div>Actualiza tu plan para usar Analytics</div>
      )}
    </div>
  );
}
```

---

## 🔄 ¿Qué Cambia Automáticamente?

### ✅ Automático (No requiere código):
1. **Interfaz de Planes**: Tu módulo aparecerá automáticamente
2. **Permisos**: Se asignan dinámicamente desde BD
3. **Protección de Rutas**: `ProtectedRoute` lo detecta solo
4. **Estado Inicial**: Se inicializa automáticamente
5. **Validación**: El sistema valida el módulo automáticamente

### 📊 Visualización en UI:

El módulo aparecerá automáticamente en:
- Página de planes (`/planes`)
- Dashboard de módulos activos
- Componente `ModulosStatus`
- Sidebar (con ícono de candado si no disponible)

---

## 🧪 Ejemplos de Módulos

### Módulo de Reportes:
```typescript
{
  key: 'reports',
  nombre: 'Reportes',
  icon: '📈',
  descripcion: 'Generación de reportes avanzados',
  campoBD: 'tiene_reports',
  permissionKey: 'canUseReports',
  categoria: 'premium'
}
```

### Módulo de API:
```typescript
{
  key: 'api_access',
  nombre: 'API Access',
  icon: '🔌',
  descripcion: 'Acceso a API REST',
  campoBD: 'tiene_api_access',
  permissionKey: 'canUseAPI',
  categoria: 'enterprise'
}
```

### Módulo de Multi-sucursal:
```typescript
{
  key: 'multi_branch',
  nombre: 'Multi-sucursal',
  icon: '🏢',
  descripcion: 'Gestión de múltiples sucursales',
  campoBD: 'tiene_multi_branch',
  permissionKey: 'canUseMultiBranch',
  categoria: 'enterprise'
}
```

---

## 🎉 ¡Listo!

Una vez completados estos 3 pasos:
1. Reinicia la aplicación
2. Tu módulo aparecerá automáticamente en todas partes
3. Podrás proteger rutas y verificar permisos
4. Los usuarios verán el módulo según su plan

**No requiere modificar más código!** El sistema es completamente dinámico.
