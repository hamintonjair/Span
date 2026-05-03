-- Crear tabla para comprobantes de pago
CREATE TABLE IF NOT EXISTS comprobantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    tipo_archivo VARCHAR(50) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    verificado BOOLEAN DEFAULT FALSE,
    notas TEXT,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_verificacion TIMESTAMP WITH TIME ZONE,
    verificado_por UUID REFERENCES auth.users(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa_id ON comprobantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_estado ON comprobantes(estado);
CREATE INDEX IF NOT EXISTS idx_comprobantes_verificado ON comprobantes(verificado);
CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha_envio ON comprobantes(fecha_envio);

-- Crear trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION handle_actualizado_en_comprobantes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizado_en_comprobantes
    BEFORE UPDATE ON comprobantes
    FOR EACH ROW
    EXECUTE FUNCTION handle_actualizado_en_comprobantes();
