-- Actualizar RPC admin_cerrar_caja para incluir trazabilidad
-- Añadir campo creado_por/cerrado_por

CREATE OR REPLACE FUNCTION admin_cerrar_caja(
    p_caja_id UUID,
    p_monto_cierre NUMERIC,
    p_fecha_cierre TIMESTAMP WITH TIME ZONE,
    p_monto_esperado NUMERIC,
    p_cerrado_por UUID  -- Nuevo parámetro para trazabilidad
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    caja_actualizada JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecutar con privilegios del propietario
SET search_path = public  -- Asegurar que use el schema correcto
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
    
    -- Actualizar la caja directamente con SERVICE ROLE
    UPDATE cajas 
    SET 
        estado = 'cerrada',
        monto_cierre = p_monto_cierre,
        fecha_cierre = p_fecha_cierre,
        monto_esperado = p_monto_esperado,
        cerrado_por = p_cerrado_por,  -- Nuevo campo de trazabilidad
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
        'Caja cerrada exitosamente con SERVICE ROLE',
        to_jsonb(c)
    FROM cajas c
    WHERE id = p_caja_id;
    
END;
$$;

-- Otorgar permisos SOLO a service_role
GRANT EXECUTE ON FUNCTION admin_cerrar_caja TO service_role;
REVOKE EXECUTE ON FUNCTION admin_cerrar_caja FROM authenticated, anon;

-- Probar el RPC con el nuevo parámetro
-- SELECT admin_cerrar_caja(
--     'c2365c54-b432-409e-8503-86539a12a527'::UUID,
--     24280::NUMERIC,
--     NOW()::TIMESTAMP WITH TIME ZONE,
--     24280::NUMERIC,
--     'fc7bf3bb-f283-4a94-823e-54f67d74245c'::UUID
-- );
