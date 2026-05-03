# Crear Bucket "logos" en Supabase Storage

## Pasos para crear el bucket

### 1. Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto `mjcaauygnpzypsebayye`

### 2. Crear el Bucket
1. En el menú lateral, haz clic en **"Storage"**
2. Haz clic en **"New bucket"**
3. Configura el bucket:
   - **Name**: `logos`
   - **Public bucket**: ✅ Marcar como público
   - **File size limit**: `2MB` (opcional)
   - **Allowed MIME types**: `image/*` (opcional)

### 3. Configurar Políticas de Acceso (RLS)
Para que el bucket sea público y permita subir archivos, ejecuta las siguientes políticas SQL:

```sql
-- Política para permitir lectura pública de los logos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Política para permitir subida de logos (solo usuarios autenticados)
CREATE POLICY "Upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir actualizar logos (solo usuarios autenticados)
CREATE POLICY "Update logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir eliminar logos (solo usuarios autenticados)
CREATE POLICY "Delete logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.role() = 'authenticated'
);
```

### 4. Verificar Configuración
1. El bucket debería aparecer en la lista de buckets
2. Debería tener un ícono de candado abierto (público)
3. Puedes probar subiendo un archivo manualmente

### 5. Comandos SQL Alternativos
Si prefieres crear el bucket por SQL:

```sql
-- Crear bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Configurar políticas (misma consulta anterior)
```

## Formatos Soportados

El sistema acepta los siguientes formatos de imagen:
- **JPG/JPEG**: `image/jpeg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **SVG**: `image/svg+xml`

## Configuración Adicional

### Tamaño Máximo de Archivo
- Límite configurado: 2MB
- Validado en frontend y backend

### Nombres de Archivo
- Formato: `logo-${timestamp}.${extension}`
- Ejemplo: `logo-1714378123456.svg`

### URL Pública
Los archivos serán accesibles vía:
```
https://mjcaauygnpzypsebayye.supabase.co/storage/v1/object/logos/{filename}
```

## Solución de Problemas

### Error: "Bucket not found"
- Causa: El bucket `logos` no existe
- Solución: Sigue los pasos anteriores para crearlo

### Error: "Permission denied"
- Causa: Las políticas RLS no están configuradas correctamente
- Solución: Ejecuta las políticas SQL mencionadas

### Error: "File too large"
- Causa: El archivo excede el límite de tamaño
- Solución: Reduce el tamaño del archivo a menos de 2MB

## Prueba del Sistema
Una vez creado el bucket:
1. Ve a la configuración de admin: `/admin/configuracion`
2. Intenta subir un logo
3. Verifica que aparezca la vista previa
4. Guarda la configuración
5. Recarga la página para confirmar que el logo persista en el campo `logo_url`
