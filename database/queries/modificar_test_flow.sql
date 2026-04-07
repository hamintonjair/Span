-- ============================================
-- Crear Perfil sin Usuario (para test-flow)
-- ============================================

-- Crear un ID de perfil de prueba
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    created_at
) VALUES (
    gen_random_uuid(),  -- ID de prueba
    'eea1496f-8756-4fd4-b41b-d557b2aec2dc',  -- ID de la empresa existente
    'Usuario Test',
    'test@beautypro.com',
    '+52 555 0123',
    'admin_empresa',
    NOW()
) ON CONFLICT DO NOTHING;

-- Verificar que el perfil se creó
SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    e.nombre as empresa_nombre
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.email = 'test@beautypro.com';
