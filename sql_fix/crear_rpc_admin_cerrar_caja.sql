-- RPC con SERVICE ROLE para bypass completo de RLS
-- Este procedimiento se ejecuta con privilegios de administrador

CREATE OR REPLACE FUNCTION admin_cerrar_caja(
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
SECURITY DEFINER  -- Ejecutar con privilegios del propietario
SET search_path = public  -- Asegurar que use el schema correcto
AS $$
DECLARE
    v_caja_existente BOOLEAN;
    v_filas_actualizadas INTEGER;
    v_user_id UUID;
    v_empresa_id UUID;
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
    
    -- Obtener datos de la caja para validación
    SELECT vendedor_id, empresa_id INTO v_user_id, v_empresa_id
    FROM cajas 
    WHERE id = p_caja_id;
    
    -- Actualizar la caja directamente con SERVICE ROLE
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
        'Caja cerrada exitosamente con SERVICE ROLE',
        to_jsonb(c)
    FROM cajas c
    WHERE id = p_caja_id;
    
END;
$$;

-- Otorgar permisos SOLO a service_role (no a authenticated)
-- Esto asegura que solo se pueda usar desde el backend con service role key
GRANT EXECUTE ON FUNCTION admin_cerrar_caja TO service_role;

-- Revocar permisos de otros roles por seguridad
REVOKE EXECUTE ON FUNCTION admin_cerrar_caja FROM authenticated, anon;

-- Probar el RPC (desde SQL Editor con service role)
-- SELECT admin_cerrar_caja(
--     'c2365c54-b432-409e-8503-86539a12a527'::UUID,
--     24280::NUMERIC,
--     NOW()::TIMESTAMP WITH TIME ZONE,
--     24280::NUMERIC
-- );
