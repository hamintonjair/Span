-- ========================================
-- MIGRACIÓN: MÓDULOS ADMIN GLOBAL
-- ========================================

-- 1. Actualizar tabla empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planes(id),
ADD COLUMN IF NOT EXISTS limite_empleados INTEGER DEFAULT 5;

-- 2. Crear tabla planes
CREATE TABLE IF NOT EXISTS planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  limite_usuarios INTEGER NOT NULL DEFAULT 5,
  limite_sucursales INTEGER NOT NULL DEFAULT 1,
  descripcion TEXT,
  caracteristicas JSONB DEFAULT '{}',
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insertar planes por defecto
INSERT INTO planes (nombre, precio, limite_usuarios, limite_sucursales, descripcion, caracteristicas) VALUES
('Básico', 29.99, 5, 1, 'Plan perfecto para pequeños salones', '{"reportes_basicos": true, "soporte_email": true}'),
('Profesional', 79.99, 20, 3, 'Ideal para salones en crecimiento', '{"reportes_avanzados": true, "soporte_email": true, "soporte_telefonico": true, "api_acceso": true}'),
('Empresarial', 199.99, 50, 10, 'Para grandes cadenas de salones', '{"reportes_avanzados": true, "soporte_prioritario": true, "api_acceso": true, "integraciones": true, "white_label": true}')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Crear tabla logs_actividad
CREATE TABLE IF NOT EXISTS logs_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id),
  empresa_id UUID REFERENCES empresas(id),
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descripcion TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON empresas(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_plan_id ON empresas(plan_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs_actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_empresa_id ON logs_actividad(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_creado_en ON logs_actividad(creado_en);

-- 6. Actualizar empresas existentes con plan básico por defecto
UPDATE empresas 
SET plan_id = (SELECT id FROM planes WHERE nombre = 'Básico' LIMIT 1),
    limite_empleados = 5
WHERE plan_id IS NULL;

-- 7. Verificar la estructura
SELECT 
  e.nombre as empresa,
  e.estado,
  e.limite_empleados,
  p.nombre as plan,
  p.precio,
  p.limite_usuarios
FROM empresas e
LEFT JOIN planes p ON e.plan_id = p.id
ORDER BY e.nombre;

-- 8. Verificar planes creados
SELECT * FROM planes ORDER BY precio;

-- 9. Verificar logs (debería estar vacío inicialmente)
SELECT COUNT(*) as total_logs FROM logs_actividad;
