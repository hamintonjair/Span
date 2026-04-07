-- ============================================
-- SOLUCIÓN SIMPLE: Solo lo necesario
-- ============================================

-- PASO 1: Crear empresa
INSERT INTO empresas (
    id, nombre, plan_id, estado_suscripcion, fecha_vencimiento, created_at
) VALUES (
    gen_random_uuid(), 'Salón Test Principal', 'basico', 'activa', '2024-12-31', NOW()
) ON CONFLICT DO NOTHING;

-- PASO 2: Crear perfil
INSERT INTO perfiles (
    id, empresa_id, nombre, email, telefono, rol, created_at
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000', 
    (SELECT id FROM empresas WHERE nombre = 'Salón Test Principal' LIMIT 1),
    'Usuario Test', 'test@salon.com', '+52 555 0123', 'admin_empresa', NOW()
) ON CONFLICT (id) DO NOTHING;

-- PASO 3: Verificar
SELECT '✅ PERFIL CREADO' as resultado;
