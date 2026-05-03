-- Crear tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS tickets_soporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id),
    usuario_creador_id UUID REFERENCES usuarios_sistema(id),
    asunto VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    asignado_a UUID REFERENCES usuarios_staff(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_empresa_id ON tickets_soporte(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_usuario_creador_id ON tickets_soporte(usuario_creador_id);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_estado ON tickets_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_prioridad ON tickets_soporte(prioridad);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_asignado_a ON tickets_soporte(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_creado_en ON tickets_soporte(creado_en);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_tickets_soporte_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_soporte_updated_at
    BEFORE UPDATE ON tickets_soporte
    FOR EACH ROW
    EXECUTE FUNCTION handle_tickets_soporte_updated_at();
