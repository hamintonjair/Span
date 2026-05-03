-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'estilista', 'recepcionista', 'usuario')),
    email VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_hash VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_empresa_id ON usuarios_sistema(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_email ON usuarios_sistema(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_rol ON usuarios_sistema(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_activo ON usuarios_sistema(activo);

-- Crear trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION handle_usuarios_sistema_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_sistema_updated_at
    BEFORE UPDATE ON usuarios_sistema
    FOR EACH ROW
    EXECUTE FUNCTION handle_usuarios_sistema_updated_at();
