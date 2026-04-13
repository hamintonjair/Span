-- Migration: Migrate historical commissions from paid appointments only
-- This script creates commission records for historical appointments that were paid
-- IMPORTANT: Only processes appointments, ignoring direct POS sales

-- First, ensure the porcentaje_comision column exists (run if not already executed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empleados' 
        AND column_name = 'porcentaje_comision'
    ) THEN
        ALTER TABLE empleados ADD COLUMN porcentaje_comision NUMERIC DEFAULT 50;
        ALTER TABLE empleados ADD CONSTRAINT check_porcentaje_comision 
            CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 100);
        UPDATE empleados SET porcentaje_comision = 50 WHERE porcentaje_comision IS NULL;
    END IF;
END $$;

-- Create commission records for historical paid appointments
INSERT INTO comisiones (
    empresa_id,
    empleado_id,
    venta_id,
    monto_base,
    porcentaje_aplicado,
    monto_comision,
    estado,
    created_at
)
SELECT 
    c.empresa_id,
    c.empleado_id,
    v.id as venta_id,
    v.total as monto_base,
    COALESCE(e.porcentaje_comision, 50) as porcentaje_aplicado,
    (v.total * COALESCE(e.porcentaje_comision, 50) / 100) as monto_comision,
    'pendiente' as estado,
    c.created_at as created_at
FROM citas c
INNER JOIN ventas v ON v.cita_id = c.id
INNER JOIN empleados e ON e.id = c.empleado_id
WHERE 
    c.estado = 'Pagado'  -- Only paid appointments
    AND c.empleado_id IS NOT NULL  -- Must have assigned employee
    AND v.total > 0  -- Must have a valid total amount
    AND NOT EXISTS (  -- Avoid duplicates
        SELECT 1 FROM comisions com 
        WHERE com.venta_id = v.id
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comisiones_empresa_empleado ON comisiones(empresa_id, empleado_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_venta_id ON comisiones(venta_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON comisiones(estado);

-- Log the migration results
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM comisiones;
    
    RAISE NOTICE 'Migration completed: % commission records created', migrated_count;
    
    -- Show breakdown by company
    SELECT 
        empresa_id,
        COUNT(*) as commission_count,
        SUM(monto_comision) as total_commissions
    FROM comisiones 
    GROUP BY empresa_id
    ORDER BY empresa_id;
END $$;
