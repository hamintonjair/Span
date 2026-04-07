# Servicios de la Aplicación

Esta carpeta contiene la lógica de negocio implementada con Next.js Server Actions.

## 📁 Estructura de Servicios

### 🏦 `caja.service.ts`
Gestiona las operaciones de caja del salón.

#### Funciones Principales:
- **`abrirCaja(datos)`**: Abre nueva caja validando que no haya una abierta
- **`cerrarCaja(cajaId, montoFinal, empresaId)`**: Cierra caja y calcula arqueo
- **`getCajaAbierta(empresaId)`**: Obtiene caja abierta actual
- **`getHistorialCajas(empresaId, pagina, limite)`**: Historial paginado de cajas

#### Validaciones:
- ✅ Solo una caja abierta por empresa
- ✅ Cálculo automático de diferencias
- ✅ Auditoría de arqueos

### 💰 `nomina.service.ts`
Maneja cálculos de nómina y préstamos.

#### Funciones Principales:
- **`calcularNominaEmpleado(empleadoId, empresaId, fechaInicio, fechaFin)`**: Calcula nómina individual
- **`calcularNominaMultiple(empresaId, fechaInicio, fechaFin, empleadosIds)`**: Nómina múltiple
- **`getResumenNominas(empresaId, fechaInicio, fechaFin)`**: Resumen para dashboard

#### Cálculos Automáticos:
- ✅ Sueldo base + comisiones por ventas
- ✅ Descuento automático de préstamos activos
- ✅ Actualización de saldos pendientes
- ✅ Cambio de estado a 'pagado' cuando salda deuda

### 🛒 `ventas.service.ts`
Gestiona el registro y gestión de ventas.

#### Funciones Principales:
- **`registrarVenta(datos)`**: Registra nueva venta con detalles
- **`actualizarVentaCita(citaId, empresaId, itemsAdicionales)`**: Upselling en citas
- **`getVentas(empresaId, filtros)`**: Consulta con filtros avanzados
- **`cancelarVenta(ventaId, empresaId, motivo)`**: Cancelación y devolución de stock

#### Características:
- ✅ Actualización automática de stock
- ✅ Soporte para productos y servicios
- ✅ Cálculo automático de impuestos
- ✅ Gestión de upselling en citas

### 🛠️ `utils.ts`
Utilidades comunes para todos los servicios.

#### Funciones de Ayuda:
- **`handleSupabaseError(error)`**: Manejo estandarizado de errores
- **`formatCurrency(amount)`**: Formateo de moneda
- **`calcularIVA(subtotal, tasa)`**: Cálculo de impuestos
- **`formatDate(date, format)`**: Formateo de fechas
- **`paginateResults(results, page, limit)`**: Paginación segura

## 🔐 Seguridad

Todos los servicios incluyen:
- ✅ Validación de empresa_id (multi-tenant)
- ✅ Manejo de errores con try/catch
- ✅ Respuestas estandarizadas con `ApiResponse<T>`
- ✅ Logging de errores para debugging

## 📊 Tipos de Respuesta

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
```

## 🚀 Uso en Componentes

```typescript
import { abrirCaja, getCajaAbierta } from '@/services';

// En un Server Component
async function CajaComponent({ empresaId }: { empresaId: string }) {
  const cajaAbierta = await getCajaAbierta(empresaId);
  
  if (cajaAbierta.error) {
    return <div>Error: {cajaAbierta.error}</div>;
  }
  
  return <div>Estado de caja: {cajaAbierta.data?.estado || 'Sin caja abierta'}</div>;
}

// En un Client Component con Server Actions
'use client';

import { abrirCaja } from '@/services';

async function handleAbrirCaja(datos: CrearCajaForm) {
  const resultado = await abrirCaja(datos);
  
  if (resultado.error) {
    toast.error(resultado.error);
  } else {
    toast.success(resultado.message);
  }
}
```

## 🔄 Flujo de Trabajo Típico

1. **Apertura de Caja**: `abrirCaja()`
2. **Registro de Ventas**: `registrarVenta()`
3. **Upselling**: `actualizarVentaCita()`
4. **Cierre de Caja**: `cerrarCaja()`
5. **Cálculo de Nómina**: `calcularNominaEmpleado()`

## 📝 Notas Importantes

- Todos los servicios usan `use server` para Server Actions
- Las transacciones críticas usan funciones RPC de Supabase
- El stock se actualiza automáticamente en cada venta
- Los préstamos se descuentan automáticamente de nóminas
- Todas las operaciones están aisladas por empresa (multi-tenant)
