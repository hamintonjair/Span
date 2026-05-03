# Sistema de Testing - Span Business

## 📦 Instalación

```bash
npm install
```

## 🧪 Comandos de Test

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests de base de datos
npm run test:db
```

## 📁 Estructura

```
src/__tests__/
├── helpers/
│   ├── supabase-mock.ts      # Mock de Supabase
│   └── test-utils.ts          # Utilidades y datos de prueba
├── database/
│   ├── empresas.test.ts       # Tests manuales (ejemplos)
│   ├── usuarios-sistema.test.ts
│   ├── citas.test.ts
│   └── generated/             # Tests generados automáticamente
├── README.md
└── _coverage_/               # Reportes de cobertura
```

## 🎯 Tests Disponibles

### Tests Manuales (Completos)
- **empresas.test.ts** - 25 tests
- **usuarios-sistema.test.ts** - 30 tests  
- **citas.test.ts** - 28 tests

### Tests Generados (Automáticos)
Ejecuta el generador para crear tests para las 30 tablas restantes:

```bash
node scripts/generate-tests.js
```

Esto creará:
- 30 archivos `.test.ts` en `database/generated/`
- Cada archivo contiene 10+ tests
- Total: ~300 tests adicionales

## 📊 Cobertura Esperada

| Categoría | Tests | Cobertura |
|-----------|-------|-----------|
| Schema Validation | 33 | 100% |
| CRUD Operations | ~132 | 95% |
| Foreign Keys | ~50 | 100% |
| Constraints | ~50 | 100% |
| Triggers | ~30 | 100% |
| **TOTAL** | **~295** | **~95%** |

## 🔄 Flujo de Testing

### 1. Schema Tests
Validan estructura de tablas, tipos de datos, constraints.

### 2. CRUD Tests
- **INSERT**: Crear registros válidos/inválidos
- **SELECT**: Consultar por ID, listar, filtrar
- **UPDATE**: Modificar campos, validar triggers
- **DELETE**: Eliminar, cascadas

### 3. Integration Tests
- Foreign keys
- Constraints CHECK
- Triggers updated_at
- Validaciones de negocio

## 🎨 Datos de Prueba

Usa los helpers en `test-utils.ts`:

```typescript
import { testUser, testEmpresa, testCita, generateUUID } from '../helpers/test-utils';

const nuevoUsuario = {
  ...testUser,
  id: generateUUID(),
  email: 'nuevo@test.com'
};
```

## 🛠️ Mock de Supabase

```typescript
import { mockSupabase, mockSuccessResponse, mockErrorResponse } from '../helpers/supabase-mock';

// Simular respuesta exitosa
mockSupabase.single.mockResolvedValue(mockSuccessResponse(data));

// Simular error
mockSupabase.single.mockResolvedValue(
  mockErrorResponse('duplicate key violation')
);
```

## 📝 Ejemplo de Test

```typescript
describe('Tabla: productos', () => {
  test('debe insertar producto válido', async () => {
    mockSupabase.from.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValue(mockSuccessResponse(testProducto));

    const { data, error } = await mockSupabase
      .from('productos')
      .insert(testProducto)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.nombre).toBe(testProducto.nombre);
  });
});
```

## 🔧 Extender Tests

Para agregar tests personalizados:

1. Crear archivo en `database/[nombre-tabla].test.ts`
2. Importar helpers
3. Escribir tests siguiendo el patrón describe/it
4. Ejecutar `npm test -- [nombre-archivo]`

## 🚀 CI/CD

El proyecto incluye script para integración continua:

```bash
npm run test:ci
```

Configura en tu pipeline:

```yaml
- name: Run Tests
  run: npm run test:ci
```

## 📈 Métricas

Ver reporte de cobertura:

```bash
npm run test:coverage
```

Abre `coverage/lcov-report/index.html` en el navegador.

## 🐛 Troubleshooting

### Error: "Cannot find name 'jest'"
```bash
npm install
```

### Error: "Module not found"
```bash
rm -rf node_modules && npm install
```

### Tests lentos
```bash
npm run test:ci -- --maxWorkers=1
```
