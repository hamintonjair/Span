-- Crear tabla de mensajes de tickets
CREATE TABLE IF NOT EXISTS mensajes_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets_soporte(id),
    usuario_id UUID REFERENCES usuarios_sistema(id),
    mensaje TEXT NOT NULL,
    es_staff BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket_ticket_id ON mensajes_ticket(ticket_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket_usuario_id ON mensajes_ticket(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket_creado_en ON mensajes_ticket(creado_en);
CREATE INDEX IF NOT EXISTS idx_mensajes_ticket_es_staff ON mensajes_ticket(es_staff);
