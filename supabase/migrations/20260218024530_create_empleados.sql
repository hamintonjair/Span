-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula VARCHAR(20) NOT NULL UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    telefono VARCHAR(50),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sueldo_base DECIMAL(10,2) NOT NULL,
    email_empleado VARCHAR(255),
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_contratacion DATE,
    porcentaje_comision DECIMAL(5,2) DEFAULT 0
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_id ON empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_cedula ON empleados(cedula);
CREATE INDEX IF NOT EXISTS idx_empleados_estado ON empleados(estado);
CREATE INDEX IF NOT EXISTS idx_empleados_email_empleado ON empleados(email_empleado);
CREATE INDEX IF NOT EXISTS idx_empleados_nombre_completo ON empleados(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_empleados_fecha_contratacion ON empleados(fecha_contratacion);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION handle_empleados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empleados_updated_at
    BEFORE UPDATE ON empleados
    FOR EACH ROW
    EXECUTE FUNCTION handle_empleados_updated_at();
