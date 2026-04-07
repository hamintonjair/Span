-- RPC para cerrar caja directamente (bypass de RLS/triggers)
-- Este procedimiento almacenado ejecuta el UPDATE directamente en la base de datos
-- sin pasar por las restricciones de Row Level Security

CREATE OR REPLACE FUNCTION cerrar_caja_directo(
    p_caja_id UUID,
    p_monto_cierre NUMERIC,
    p_fecha_cierre TIMESTAMP WITH TIME ZONE,
    p_monto_esperado NUMERIC
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    caja_actualizada JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecutar con privilegios del propietario (bypass RLS)
AS $$
DECLARE
    v_caja_existente BOOLEAN;
    v_filas_actualizadas INTEGER;
BEGIN
    -- Verificar si la caja existe
    SELECT EXISTS (
        SELECT 1 FROM cajas 
        WHERE id = p_caja_id
    ) INTO v_caja_existente;
    
    IF NOT v_caja_existente THEN
        RETURN QUERY SELECT false, 'Caja no encontrada', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Actualizar la caja directamente
    UPDATE cajas 
    SET 
        estado = 'cerrada',
        monto_cierre = p_monto_cierre,
        fecha_cierre = p_fecha_cierre,
        monto_esperado = p_monto_esperado,
        updated_at = NOW()
    WHERE id = p_caja_id;
    
    GET DIAGNOSTICS v_filas_actualizadas = ROW_COUNT;
    
    IF v_filas_actualizadas = 0 THEN
        RETURN QUERY SELECT false, 'No se actualizó ninguna fila', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Retornar la caja actualizada
    RETURN QUERY 
    SELECT 
        true, 
        'Caja cerrada exitosamente',
        to_jsonb(c)
    FROM cajas c
    WHERE id = p_caja_id;
    
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION cerrar_caja_directo TO authenticated, anon, service_role;

-- Probar el RPC
-- SELECT cerrar_caja_directo(
--     'c2365c54-b432-409e-8503-86539a12a527'::UUID,
--     24280::NUMERIC,
--     NOW()::TIMESTAMP WITH TIME ZONE,
--     24280::NUMERIC
-- );
