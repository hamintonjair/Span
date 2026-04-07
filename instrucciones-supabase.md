# Instrucciones para Configurar la Base de Datos en Supabase

## 📋 Pasos para Ejecutar el Esquema

### 1. Accede a tu Proyecto Supabase
- Ve a [https://supabase.com](https://supabase.com)
- Inicia sesión y selecciona tu proyecto
- Ve a la sección **SQL Editor**

### 2. Ejecuta el Esquema
- Copia todo el contenido del archivo `supabase-schema.sql`
- Pégalo en el SQL Editor de Supabase
- Haz clic en **Run** para ejecutar el script

### 3. Configura las Variables de Entorno
Actualiza tu archivo `.env.local` con las credenciales de tu proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

## 🏗️ Estructura del Esquema

### Tablas Principales

#### 🏢 `empresas`
- Almacena información de cada salón de belleza
- Multi-tenant: cada empresa tiene sus datos aislados
- Campos: id, nombre, logo, plan_id, estado_suscripcion, fecha_vencimiento

#### 👤 `perfiles`
- Vinculada a `auth.users` de Supabase
- Define roles: admin_global, admin_empresa, estilista, recepcionista
- Cada perfil pertenece a una empresa

#### 💰 `cajas`
- Control de caja diaria por empresa
- Estados: abierta, cerrada
- Registra base_inicial, monto_final, fechas de apertura/cierre

#### 👨‍💼 `empleados`
- Información laboral de los estilistas
- Sueldo base y porcentaje de comisión
- Vinculado a un perfil de usuario

#### 💸 `prestamos`
- Préstamos a empleados
- Control de saldo pendiente y cuotas mensuales
- Estados: activo, pagado, vencido

## 🔐 Seguridad (Row Level Security)

### Políticas Implementadas

1. **Aislamiento por Empresa**: Todos los usuarios solo ven datos de su empresa
2. **Jerarquía de Roles**:
   - `admin_global`: Acceso a todas las empresas
   - `admin_empresa`: Acceso completo a su empresa
   - `recepcionista`: Gestión de cajas
   - `estilista`: Solo puede ver sus préstamos

### Reglas de Acceso

| Rol | Empresas | Perfiles | Cajas | Empleados | Préstamos |
|-----|----------|----------|-------|-----------|-----------|
| admin_global | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| admin_empresa | ✅ RUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| recepcionista | ❌ | 👤 Own | ✅ CRUD | ❌ | ❌ |
| estilista | ❌ | 👤 Own | ❌ | ❌ | 👤 Own |

## 🚀 Próximos Pasos

1. **Ejecuta el esquema** en Supabase
2. **Crea usuarios** en auth.users
3. **Inserta perfiles** vinculando usuarios a empresas
4. **Prueba las políticas RLS** con diferentes roles

## 📝 Notas Importantes

- Todos los datos están aislados por `empresa_id`
- Los triggers actualizan automáticamente `updated_at`
- Las restricciones aseguran integridad de datos
- Los índices mejoran el rendimiento en consultas multi-tenant
