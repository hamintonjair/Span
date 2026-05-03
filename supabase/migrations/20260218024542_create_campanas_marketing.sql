-- Crear tabla de campañas de marketing
CREATE TABLE IF NOT EXISTS campanas_marketing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviada', 'cancelada')),
    nombre VARCHAR(255) NOT NULL,
    mensaje TEXT,
    audiencia VARCHAR(50) NOT NULL DEFAULT 'todos' CHECK (audiencia IN ('todos', 'clientes', 'vip', 'activos')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_campanas_marketing_empresa_id ON campanas_marketing(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanas_marketing_estado ON campanas_marketing(estado);
CREATE INDEX IF NOT EXISTS idx_campanas_marketing_audiencia ON campanas_marketing(audiencia);
CREATE INDEX IF NOT EXISTS idx_campanas_marketing_created_at ON campanas_marketing(created_at);
