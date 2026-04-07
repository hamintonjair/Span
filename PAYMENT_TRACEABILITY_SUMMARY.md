# 🎯 **Lógica de Trazabilidad de Pagos Finalizada**

## ✅ **Implementación Completa**

### 1. **Generación de Deuda** ✅
**API:** `/api/cron/check-expirations` (POST)

**Flujo Exacto:**
- ✅ **Detecta vencimiento:** `fecha_vencimiento < fecha_actual`
- ✅ **Suspende empresa:** `empresas.estado = 'suspendido'`
- ✅ **Crea deuda:** `suscripciones.estado_pago = 'vencido'` + `monto` del plan
- ✅ **Sin duplicados:** Verifica si ya existe suscripción vencida para esa empresa

**Código Clave:**
```typescript
// Obtener información del plan para el monto
const { data: plan, error: planError } = await supabase
  .from('planes')
  .select('precio')
  .eq('id', empresa.plan_id)
  .single();

// Verificar si ya existe suscripción vencida para esta empresa
const { data: suscripcionExistente } = await supabase
  .from('suscripciones')
  .select('*')
  .eq('empresa_id', empresa.id)
  .eq('estado_pago', 'vencido')
  .single();

// Crear solo si no existe
if (!suscripcionExistente) {
  await supabase.from('suscripciones').insert({
    empresa_id: empresa.id,
    estado_pago: 'vencido',
    monto: plan?.precio || 0,
    // ... otros campos
  });
}
```

---

### 2. **No Duplicar** ✅
**Prevención en Múltiples Niveles:**

#### **A. En Generación de Deuda:**
- ✅ **Verificación por empresa:** Solo una suscripción vencida por empresa
- ✅ **Sin periodo:** No filtra por mes/año, solo por existencia
- ✅ **Logging:** "Ya existe suscripción vencida, no se crea duplicado"

#### **B. En Subida de Comprobantes:**
- ✅ **Solo comprobantes:** API `/upload/comprobante` solo afecta tabla `comprobantes`
- ✅ **Sin suscripciones:** Eliminada toda creación automática en `suscripciones`
- ✅ **Flujo limpio:** Usuario sube → comprobante pendiente → espera aprobación

#### **C. En Aprobación:**
- ✅ **Busca existente:** Encuentra suscripción `'vencida'` específica
- ✅ **Actualiza, no crea:** Cambia estado a `'pagado'` + vincula `comprobante_id`
- ✅ **Fallback:** Crea nueva solo si no existe vencida

---

### 3. **Cierre del Ciclo (Aprobación)** ✅
**API:** `/api/comprobantes/[id]/aprobar` (POST)

**Flujo Exacto:**
- ✅ **Busca vencida:** Encuentra suscripción con `estado_pago = 'vencido'`
- ✅ **Actualiza a pagada:** `estado_pago = 'pagado'` + `comprobante_id`
- ✅ **Reactiva empresa:** `empresas.estado = 'activo'` + `fecha_vencimiento + 30 días`
- ✅ **Sincroniza fechas:** Misma fecha en `empresas.fecha_vencimiento` y `suscripciones.proximo_vencimiento`

**Código Clave:**
```typescript
// Buscar la fila 'vencida' para esa empresa
const { data: suscripcionVencida } = await supabase
  .from('suscripciones')
  .select('*')
  .eq('empresa_id', comprobante.empresa_id)
  .eq('estado_pago', 'vencido')
  .order('creado_en', { ascending: false })
  .limit(1)
  .single();

// Actualizar a pagado y vincular comprobante
if (suscripcionVencida) {
  await supabase.from('suscripciones')
    .update({ 
      estado_pago: 'pagado',
      verificado: true,
      comprobante_id: comprobanteId,
      proximo_vencimiento: nuevaFechaVencimiento.toISOString().split('T')[0]
    })
    .eq('id', suscripcionVencida.id);
}

// Reactivar empresa
await supabase.from('empresas')
  .update({ 
    estado: 'activo',
    fecha_vencimiento: nuevaFechaVencimiento.toISOString().split('T')[0]
  })
  .eq('id', comprobante.empresa_id);
```

---

### 4. **Limpieza** ✅
**API:** `/api/cron/clean-duplicate-subscriptions` (POST)

**Funcionalidad:**
- ✅ **Agrupa por empresa:** Una suscripción vencida por empresa
- ✅ **Mantiene reciente:** Elimina duplicados, conserva la más nueva
- ✅ **Reporte detallado:** IDs eliminados y cantidades

---

## 🔄 **Flujo Completo de Trazabilidad**

### **Ciclo de Vida de Suscripción:**

#### **1. Estado Normal:**
```
Empresa: activa
Suscripción: pagada
Usuario: Acceso completo
```

#### **2. Vencimiento:**
```
Fecha pasa → API detecta → 
├─ Empresa: suspendido
├─ Suscripción: vencida (con monto del plan)
└─ Usuario: Solo puede ver suscripción + subir comprobantes
```

#### **3. Subida de Comprobante:**
```
Usuario sube archivo → 
├─ Comprobante: pendiente
├─ Suscripción: NO se crea (evita duplicados)
└─ Admin: Puede aprobar
```

#### **4. Aprobación:**
```
Admin aprueba → 
├─ Comprobante: aprobado + verificado
├─ Suscripción: vencida → pagada + comprobante_id
├─ Empresa: suspendido → activo + fecha +30 días
└─ Usuario: Acceso completo restaurado
```

#### **5. Limpieza:**
```
Cron ejecuta → 
├─ Agrupa duplicados por empresa
├─ Elimina repetidos
└─ Mantiene registro más reciente
```

---

## 🛡️ **Control de Duplicados - 3 Niveles**

### **Nivel 1 - Generación:**
- ✅ **Verificación por empresa** (no por periodo)
- ✅ **Una vencida por empresa**
- ✅ **Logging de prevención**

### **Nivel 2 - Subida:**
- ✅ **Solo comprobantes**
- ✅ **Sin creación de suscripciones**
- ✅ **Flujo separado**

### **Nivel 3 - Aprobación:**
- ✅ **Busca existente**
- ✅ **Actualiza, no crea**
- ✅ **Vinculación correcta**

---

## 📊 **Scripts de Prueba**

### **Script Completo:**
```bash
node test-payment-flow.js
```

**Valida:**
1. ✅ Verificación de vencimientos
2. ✅ Limpieza de duplicados
3. ✅ Estado actual de empresas
4. ✅ Consistencia de datos

### **Scripts Individuales:**
```bash
# Verificación de vencimientos
POST /api/cron/check-expirations

# Limpieza de duplicados  
POST /api/cron/clean-duplicate-subscriptions
```

---

## 🎯 **Resultado Final**

### ✅ **Trazabilidad Completa:**
- **Cada pago** tiene origen claro (deuda generada automáticamente)
- **Cada comprobante** está vinculado a su suscripción
- **Cada empresa** tiene historial limpio sin duplicados
- **Cada estado** está sincronizado entre tablas

### ✅ **Sin Duplicados:**
- **Una deuda** por empresa vencida
- **Un comprobante** por archivo subido
- **Una suscripción** activa por empresa
- **Historial limpio** con registros únicos

### ✅ **Flujo Automático:**
- **Detección automática** de vencimientos
- **Generación automática** de deudas
- **Reactivación controlada** por aprobación
- **Limpieza programada** de duplicados

---

**🎉 Sistema de trazabilidad de pagos completo y sin duplicados implementado.**
