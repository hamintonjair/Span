-- Crear tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit VARCHAR(50) NOT NULL UNIQUE,
    logo TEXT,
    ciudad VARCHAR(100),
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
    nombre VARCHAR(255) NOT NULL,
    plan_id UUID REFERENCES planes(id),
    logo_url TEXT,
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mensaje_ticket TEXT DEFAULT '¡Gracias por su compra!, Vuelve pronto.',
    fecha_vencimiento DATE,
    estado_suscripcion TEXT DEFAULT 'pendiente' CHECK (estado_suscripcion IN ('activa', 'pendiente', 'vencida', 'cancelada')),
    limite_empleados INTEGER DEFAULT 5
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_nit ON empresas(nit);
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON empresas(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_plan_id ON empresas(plan_id);
CREATE INDEX IF NOT EXISTS idx_empresas_ciudad ON empresas(ciudad);
CREATE INDEX IF NOT EXISTS idx_empresas_fecha_vencimiento ON empresas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_empresas_estado_suscripcion ON empresas(estado_suscripcion);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION handle_empresas_updated_at();
