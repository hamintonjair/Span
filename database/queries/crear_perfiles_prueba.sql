-- ============================================
-- Crear Perfiles para Usuarios de Prueba
-- ============================================

-- NOTA: Reemplaza 'UUID_DEL_ADMIN_GLOBAL' con el ID real del usuario creado
-- Puedes obtener el ID desde Authentication → Users → Click en el usuario

-- Perfil para Admin Global
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_DEL_ADMIN_GLOBAL',  -- ← REEMPLAZAR CON ID REAL
    NULL,  -- Admin global no tiene empresa
    'Admin BeautyPro',
    'admin@beautypro.com',
    '+52 555 0101',
    'admin_global',
    NOW()
);

-- NOTA: Reemplaza 'UUID_DEL_EMPRESA' con el ID real del segundo usuario

-- Perfil para Admin Empresa (necesita empresa primero)
-- Primero creamos una empresa de prueba
INSERT INTO empresas (
    id,
    nombre,
    plan_id,
    estado_suscripcion,
    fecha_vencimiento,
    created_at
) VALUES (
    gen_random_uuid(),
    'Salón Belleza Test',
    'basico',
    'activa',
    '2024-12-31',
    NOW()
) RETURNING id;

-- Luego el perfil del admin empresa
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre,
    email,
    telefono,
    rol,
    creado_en
) VALUES (
    'UUID_DEL_EMPRESA',  -- ← REEMPLAZAR CON ID REAL
    'ID_EMPRESA_CREADA_ARRIBA',  -- ← REEMPLAZAR CON ID DE EMPRESA
    'Carlos Dueño',
    'empresa@beautypro.com',
    '+52 555 0102',
    'admin_empresa',
    NOW()
);

-- ============================================
-- Verificar que los perfiles se crearon
-- ============================================

SELECT 
    p.id,
    p.nombre,
    p.email,
    p.rol,
    p.empresa_id,
    e.nombre as nombre_empresa
FROM perfiles p
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE p.email IN ('admin@beautypro.com', 'empresa@beautypro.com')
ORDER BY p.creado_en DESC;
