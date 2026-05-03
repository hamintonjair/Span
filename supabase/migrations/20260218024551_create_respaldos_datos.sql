-- Crear tabla de respaldos de datos
CREATE TABLE IF NOT EXISTS respaldos_datos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    datos JSONB NOT NULL,
    creado_por UUID REFERENCES usuarios_staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_respaldos_datos_empresa_id ON respaldos_datos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_respaldos_datos_creado_por ON respaldos_datos(creado_por);
CREATE INDEX IF NOT EXISTS idx_respaldos_datos_created_at ON respaldos_datos(created_at);
CREATE INDEX IF NOT EXISTS idx_respaldos_datos_nombre_archivo ON respaldos_datos(nombre_archivo);
