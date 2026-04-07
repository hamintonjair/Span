-- ========================================
-- SETUP DE PRUEBA COMPLETO
-- ========================================

-- 1. Crear 3 empresas con diferentes planes
INSERT INTO empresas (nombre, estado, plan_id, limite_empleados) VALUES
('BeautyPro Central', 'activo', (SELECT id FROM planes WHERE nombre = 'Profesional'), 20),
('Salón Elegance', 'activo', (SELECT id FROM planes WHERE nombre = 'Básico'), 5),
('Spa Relax Total', 'activo', (SELECT id FROM planes WHERE nombre = 'Empresarial'), 50)
ON CONFLICT (nombre) DO NOTHING;

-- 2. Crear usuario Dueño para BeautyPro Central
INSERT INTO usuarios_sistema (
  id,
  email,
  password_hash,
  nombre,
  rol,
  empresa_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'dueño@beautypro.com',
  '$2b$12$PMlmYRaS5kG4wT.5rSiVE.hjHnVc8l5CqNMTCIkBZUSv5IqT3bMiS',
  'Carlos Dueño',
  'dueño',
  (SELECT id FROM empresas WHERE nombre = 'BeautyPro Central' LIMIT 1),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Crear algunos empleados adicionales
INSERT INTO usuarios_sistema (
  id,
  email,
  password_hash,
  nombre,
  rol,
  empresa_id,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'estilista@beautypro.com',
  '$2b$12$PMlmYRaS5kG4wT.5rSiVE.hjHnVc8l5CqNMTCIkBZUSv5IqT3bMiS',
  'Ana Estilista',
  'estilista',
  (SELECT id FROM empresas WHERE nombre = 'BeautyPro Central' LIMIT 1),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'recepcion@beautypro.com',
  '$2b$12$PMlmYRaS5kG4wT.5rSiVE.hjHnVc8l5CqNMTCIkBZUSv5IqT3bMiS',
  'María Recepción',
  'recepcionista',
  (SELECT id FROM empresas WHERE nombre = 'BeautyPro Central' LIMIT 1),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 4. Verificar todo creado correctamente
SELECT 
  e.nombre as empresa,
  e.estado,
  p.nombre as plan,
  p.precio,
  e.limite_empleados,
  COUNT(u.id) as total_usuarios
FROM empresas e
LEFT JOIN planes p ON e.plan_id = p.id
LEFT JOIN usuarios_sistema u ON u.empresa_id = e.id
GROUP BY e.id, e.nombre, e.estado, p.nombre, p.precio, e.limite_empleados
ORDER BY e.nombre;

-- 5. Mostrar usuarios creados
SELECT 
  u.email,
  u.nombre,
  u.rol,
  e.nombre as empresa,
  e.estado
FROM usuarios_sistema u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.rol IN ('dueño', 'estilista', 'recepcionista')
ORDER BY e.nombre, u.rol;
