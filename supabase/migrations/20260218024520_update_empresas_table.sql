-- Actualizar tabla empresas para incluir campos de suscripción
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planes(id),
ADD COLUMN IF NOT EXISTS limite_empleados INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON empresas(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_plan_id ON empresas(plan_id);
CREATE INDEX IF NOT EXISTS idx_empresas_fecha_vencimiento ON empresas(fecha_vencimiento);

-- Actualizar empresas existentes con plan básico por defecto
UPDATE empresas 
SET plan_id = (SELECT id FROM planes WHERE nombre = 'Básico' LIMIT 1),
    limite_empleados = 5,
    fecha_vencimiento = CURRENT_DATE + INTERVAL '30 days'
WHERE plan_id IS NULL;
