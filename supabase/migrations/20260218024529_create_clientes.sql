-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    cedula VARCHAR(20) NOT NULL,
    es_vip BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_nacimiento DATE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_es_vip ON clientes(es_vip);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION handle_clientes_updated_at();
