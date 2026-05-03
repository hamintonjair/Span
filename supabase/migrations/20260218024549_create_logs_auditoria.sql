-- Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios_staff(id),
    tipo_evento VARCHAR(100) NOT NULL,
    descripcion TEXT,
    metadata JSONB,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_tipo_evento ON logs_auditoria(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_creado_en ON logs_auditoria(creado_en);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_ip_address ON logs_auditoria(ip_address);
