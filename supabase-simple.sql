-- =============================================
-- ESQUEMA MULTI-TENANT PARA SALONES DE BELLEZA
-- VERSIÓN SIMPLIFICADA SIN TRIGGERS
-- =============================================

-- Habilitar la extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA EMPRESAS
-- =============================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    logo TEXT,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'basico',
    estado_suscripcion VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado_suscripcion IN ('activa', 'suspendida', 'cancelada')),
    fecha_vencimiento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA PERFILES (vinculada a auth.users)
-- =============================================
CREATE TABLE perfiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'estilista' CHECK (rol IN ('admin_global', 'admin_empresa', 'estilista', 'recepcionista')),
    telefono VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA CAJAS
-- =============================================
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    base_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_final DECIMAL(10,2),
    estado VARCHAR(10) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    creado_por UUID REFERENCES perfiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA EMPLEADOS
-- =============================================
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sueldo_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    fecha_contratacion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA PRESTAMOS
-- =============================================
CREATE TABLE prestamos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL,
    cuota_mensual DECIMAL(10,2) NOT NULL,
    fecha_prestamo DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_limite DATE,
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pagado', 'vencido')),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT saldo_positivo CHECK (saldo_pendiente >= 0),
    CONSTRAINT cuota_valida CHECK (cuota_mensual > 0)
);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================
CREATE INDEX idx_perfiles_empresa_id ON perfiles(empresa_id);
CREATE INDEX idx_perfiles_rol ON perfiles(rol);
CREATE INDEX idx_cajas_empresa_id ON cajas(empresa_id);
CREATE INDEX idx_cajas_estado ON cajas(estado);
CREATE INDEX idx_empleados_empresa_id ON empleados(empresa_id);
CREATE INDEX idx_empleados_perfil_id ON empleados(perfil_id);
CREATE INDEX idx_prestamos_empresa_id ON prestamos(empresa_id);
CREATE INDEX idx_prestamos_empleado_id ON prestamos(empleado_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS BÁSICAS
-- =============================================

-- Política simple para empresas
CREATE POLICY "Usuarios pueden ver empresas" ON empresas
    FOR SELECT USING (true);

-- Política simple para perfiles
CREATE POLICY "Usuarios pueden ver perfiles" ON perfiles
    FOR SELECT USING (true);

-- Política simple para cajas
CREATE POLICY "Usuarios pueden ver cajas" ON cajas
    FOR SELECT USING (true);

-- Política simple para empleados
CREATE POLICY "Usuarios pueden ver empleados" ON empleados
    FOR SELECT USING (true);

-- Política simple para préstamos
CREATE POLICY "Usuarios pueden ver prestamos" ON prestamos
    FOR SELECT USING (true);

-- Políticas de inserción/actualización (permitir todo por ahora)
CREATE POLICY "Permitir inserción en empresas" ON empresas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización en empresas" ON empresas
    FOR UPDATE WITH CHECK (true);

CREATE POLICY "Permitir inserción en perfiles" ON perfiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización en perfiles" ON perfiles
    FOR UPDATE WITH CHECK (true);

CREATE POLICY "Permitir inserción en cajas" ON cajas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización en cajas" ON cajas
    FOR UPDATE WITH CHECK (true);

CREATE POLICY "Permitir inserción en empleados" ON empleados
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización en empleados" ON empleados
    FOR UPDATE WITH CHECK (true);

CREATE POLICY "Permitir inserción en prestamos" ON prestamos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización en prestamos" ON prestamos
    FOR UPDATE WITH CHECK (true);

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================

-- Insertar una empresa de ejemplo
INSERT INTO empresas (nombre, plan_id, estado_suscripcion) 
VALUES ('Salón de Belleza Ejemplo', 'basico', 'activa');

-- Mensaje de éxito
SELECT 'Schema creado exitosamente' AS status;
