-- Crear tabla de enlace cita_servicios_adicionales
CREATE TABLE IF NOT EXISTS cita_servicios_adicionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID NOT NULL REFERENCES citas(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    servicio_id UUID NOT NULL REFERENCES servicios(id),
    precio_unitario DECIMAL(10,2) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_cita_servicios_adicionales_cita_id ON cita_servicios_adicionales(cita_id);
CREATE INDEX IF NOT EXISTS idx_cita_servicios_adicionales_servicio_id ON cita_servicios_adicionales(servicio_id);
CREATE INDEX IF NOT EXISTS idx_cita_servicios_adicionales_created_at ON cita_servicios_adicionales(created_at);
