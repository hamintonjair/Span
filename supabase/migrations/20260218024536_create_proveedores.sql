-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    nombre VARCHAR(255) NOT NULL,
    nit_rut VARCHAR(50) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacto_nombre VARCHAR(255)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa_id ON proveedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_nit_rut ON proveedores(nit_rut);
CREATE INDEX IF NOT EXISTS idx_proveedores_estado ON proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_email ON proveedores(email);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_proveedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proveedores_updated_at
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION handle_proveedores_updated_at();
