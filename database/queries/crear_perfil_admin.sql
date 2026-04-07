-- ============================================
-- Crear Perfil para admin@beautypro.com
-- ============================================

-- Reemplaza 'ID_DEL_USUARIO_ADMIN' con el ID real del usuario creado
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    created_at
) VALUES (
    'ID_DEL_USUARIO_ADMIN',  -- ← REEMPLAZAR CON ID REAL
    'eea1496f-8756-4fd4-b41b-d557b2aec2dc',  -- ID de la empresa creada
    'Admin BeautyPro',
    'admin@beautypro.com',
    '+52 555 0101',
    'admin_empresa',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que el perfil se creó
SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    e.nombre as empresa_nombre
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.email = 'admin@beautypro.com';
