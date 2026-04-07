-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES planes(id) ON DELETE RESTRICT,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pagado', 'pendiente', 'vencido')),
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    ultimo_pago TIMESTAMP WITH TIME ZONE,
    metodo_pago VARCHAR(20) DEFAULT 'manual' CHECK (metodo_pago IN ('manual', 'automatico')),
    notas_pago TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_suscripciones_empresa_id ON suscripciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_plan_id ON suscripciones(plan_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado_pago ON suscripciones(estado_pago);
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_vencimiento ON suscripciones(fecha_vencimiento);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_suscripcion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER suscripcion_updated_at
    BEFORE UPDATE ON suscripciones
    FOR EACH ROW
    EXECUTE FUNCTION handle_suscripcion_updated_at();

-- Insertar suscripciones de prueba para las empresas existentes
INSERT INTO suscripciones (empresa_id, plan_id, estado_pago, fecha_inicio, fecha_vencimiento)
SELECT 
    e.id as empresa_id,
    e.plan_id,
    CASE 
        WHEN e.estado = 'activo' THEN 'pagado'
        ELSE 'pendiente'
    END as estado_pago,
    CURRENT_DATE - INTERVAL '30 days' as fecha_inicio,
    CURRENT_DATE + INTERVAL '30 days' as fecha_vencimiento
FROM empresas e
WHERE e.plan_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verificar las suscripciones creadas
SELECT 
    s.id,
    s.empresa_id,
    e.nombre as empresa_nombre,
    s.plan_id,
    p.nombre as plan_nombre,
    p.precio,
    s.estado_pago,
    s.fecha_inicio,
    s.fecha_vencimiento,
    s.ultimo_pago,
    s.metodo_pago
FROM suscripciones s
JOIN empresas e ON s.empresa_id = e.id
JOIN planes p ON s.plan_id = p.id
ORDER BY s.creado_en DESC;
