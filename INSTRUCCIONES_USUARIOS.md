# Panel de Gestión de Usuarios - Instrucciones de Configuración

## 📋 **PASOS PARA CONFIGURAR EL SISTEMA DE USUARIOS**

### 1. **CONFIGURACIÓN DE VARIABLES DE ENTORNO**

Agrega la siguiente variable a tu archivo `.env.local`:

```bash
# SERVICE_ROLE_KEY - Llave de servicio para operaciones administrativas
# Obtén esta llave desde: Supabase Project > Settings > API > service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 2. **EJECUTAR SQL EN SUPABASE**

Ejecuta el archivo `database/usuarios_sistema.sql` en la consola de Supabase:

```sql
-- Copia y ejecuta todo el contenido del archivo SQL
-- Esto creará la tabla usuarios_sistema con políticas de seguridad
```

### 3. **FUNCIONALIDADES DEL SISTEMA**

#### 🎯 **Roles y Permisos:**

**Admin Global:**
- ✅ Puede ver TODOS los usuarios del sistema
- ✅ Puede crear usuarios de CUALQUIER rol (admin_global, dueño, empleado)
- ✅ Puede eliminar usuarios admin_global
- ✅ Acceso sin restricciones de empresa

**Dueño:**
- ✅ Puede ver solo usuarios de SU empresa
- ✅ Puede crear usuarios dueño y empleado de SU empresa
- ❌ NO puede crear usuarios admin_global
- ❌ NO puede ver usuarios de otras empresas

**Empleado:**
- ✅ Puede ver otros usuarios de su empresa (solo lectura)
- ❌ NO puede crear usuarios
- ❌ NO puede eliminar usuarios

### 4. **CARACTERÍSTICAS DEL PANEL**

#### 🚀 **Creación Automática:**
- Crea usuario en `auth.users` (autenticación)
- Crea registro en `usuarios_sistema` (datos del sistema)
- Auto-confirmación de email
- Login inmediato permitido

#### 🔐 **Seguridad:**
- Row Level Security (RLS) activado
- Políticas por rol y empresa
- Validación de permisos en cada operación
- Eliminación segura en cascada

#### 📱 **Interfaz:**
- Formulario intuitivo para crear usuarios
- Búsqueda y filtrado
- Paginación de resultados
- Indicadores visuales de roles
- Confirmación de eliminación

### 5. **ACCESO AL PANEL**

Una vez configurado, accede a:
```
http://localhost:3000/usuarios
```

### 6. **FLUJO DE USO**

1. **Admin Global** crea el primer usuario "dueño"
2. **Dueño** inicia sesión y crea sus "empleados"
3. **Empleados** pueden ver otros usuarios pero no crear
4. **Admin Global** siempre puede intervenir en cualquier empresa

### 7. **SEGURIDAD ADICIONAL**

- La `SERVICE_ROLE_KEY` debe mantenerse segura
- Solo usar en entorno del servidor
- No exponer en código del cliente
- Rotar periódicamente

---

## ✅ **LISTO PARA USAR**

El sistema está completamente configurado para gestión autónoma de usuarios sin necesidad de entrar a la consola de Supabase.
