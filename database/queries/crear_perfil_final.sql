-- ============================================
-- Crear Perfil para el Usuario Creado
-- ============================================

INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    created_at
) VALUES (
    '1d07dd17-b14c-47c8-a1b3-a74185abffe8',  -- ID del usuario creado
    'dd1801b0-42de-432f-89d9-f508796162db',  -- ID de la empresa existente
    'Usuario Test',
    'test@beautypro.com',
    '+52 555 0123',
    'admin_empresa',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que el perfil se creó correctamente
SELECT 
    p.id as perfil_id,
    p.nombre,
    p.email,
    p.rol,
    p.empresa_id,
    e.nombre as empresa_nombre
FROM perfiles p
JOIN empresas e ON p.empresa_id = e.id
WHERE p.id = '1d07dd17-b14c-47c8-a1b3-a74185abffe8';
