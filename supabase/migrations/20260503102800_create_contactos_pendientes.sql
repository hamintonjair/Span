-- Crear tabla para contactos pendientes de envío (fallback)
CREATE TABLE contactos_pendientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    empresa TEXT,
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    email_destino TEXT NOT NULL,
    contenido_html TEXT,
    metodo_envio TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'error')),
    error_message TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    enviado_en TIMESTAMPTZ
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_contactos_pendientes_estado ON contactos_pendientes(estado);
CREATE INDEX idx_contactos_pendientes_creado_en ON contactos_pendientes(creado_en);
CREATE INDEX idx_contactos_pendientes_email ON contactos_pendientes(email);

-- Crear RLS (Row Level Security) para contactos_pendientes
ALTER TABLE contactos_pendientes ENABLE ROW LEVEL SECURITY;

-- Política RLS: Solo admin_global puede ver y gestionar contactos pendientes
CREATE POLICY "Solo admin_global puede gestionar contactos pendientes" ON contactos_pendientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            JOIN usuarios_sistema ON auth.users.id = usuarios_sistema.id 
            WHERE usuarios_sistema.rol = 'admin_global'
            AND auth.users.id = auth.uid()
        )
    );
