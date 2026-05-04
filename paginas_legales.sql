-- Crear tabla paginas_legales
CREATE TABLE paginas_legales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_paginas_legales_slug ON paginas_legales(slug);
CREATE INDEX idx_paginas_legales_actualizado_en ON paginas_legales(actualizado_en);

-- Insertar registro inicial para Política de Privacidad
INSERT INTO paginas_legales (slug, titulo, contenido) VALUES (
    'privacidad',
    'Política de Privacidad',
    '# Política de Privacidad

## 1. Información que Recopilamos

Recopilamos información personal que usted nos proporciona voluntariamente al registrarse en nuestra plataforma, incluyendo:

- Nombre completo
- Dirección de correo electrónico
- Número de teléfono
- Información de su empresa o salón

## 2. Uso de la Información

Utilizamos su información para:
- Proporcionar y mantener nuestros servicios
- Mejorar y personalizar su experiencia
- Enviar comunicaciones importantes sobre su cuenta
- Cumplir con obligaciones legales

## 3. Protección de Datos

Implementamos medidas de seguridad apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.

## 4. Compartir Información

No vendemos, intercambiamos ni transferimos su información personal a terceros sin su consentimiento, excepto cuando sea requerido por ley.

## 5. Derechos del Usuario

Usted tiene derecho a:
- Acceder a su información personal
- Corregir información inexacta
- Solicitar eliminación de su información
- Oponerse al procesamiento de sus datos

## 6. Cookies

Utilizamos cookies para mejorar su experiencia en nuestro sitio web. Puede desactivar las cookies en la configuración de su navegador.

## 7. Contacto

Si tiene preguntas sobre esta política de privacidad, contáctenos en:
Email: privacidad@span.com
Teléfono: +1 234 567 890

## 8. Actualizaciones

Nos reservamos el derecho de actualizar esta política de privacidad en cualquier momento. Le notificaremos cualquier cambio significativo.

Fecha de última actualización: ' || CURRENT_DATE || ''
);

-- Insertar registro inicial para Términos y Condiciones
INSERT INTO paginas_legales (slug, titulo, contenido) VALUES (
    'terminos',
    'Términos y Condiciones',
    '# Términos y Condiciones

## 1. Aceptación de los Términos

Al registrarse y utilizar nuestros servicios, usted acepta cumplir con estos términos y condiciones.

## 2. Descripción del Servicio

Span es una plataforma de gestión integral para salones de belleza que incluye:
- Sistema de ventas y punto de venta (POS)
- Gestión de inventario
- Administración de empleados
- Programación de citas
- Gestión financiera
- Marketing y análisis

## 3. Suscripciones y Pagos

### 3.1 Planes de Suscripción
Ofrecemos diferentes planes de suscripción con características variables según sus necesidades.

### 3.2 Período de Prueba
Los planes elegibles pueden incluir un período de prueba gratuito de 15 días sin compromiso.

### 3.3 Facturación
- Las suscripciones se facturan mensualmente
- El pago se procesa automáticamente
- Puede cancelar en cualquier momento

## 4. Responsabilidades del Usuario

### 4.1 Uso Adecuado
Usted se compromete a:
- Utilizar el servicio para fines legítimos
- No violar las leyes aplicables
- No interferir con el funcionamiento del sistema

### 4.2 Seguridad de la Cuenta
Usted es responsable de:
- Mantener la confidencialidad de su contraseña
- Todas las actividades que ocurran bajo su cuenta
- Notificarnos inmediatamente de uso no autorizado

## 5. Propiedad Intelectual

Todo el contenido, software y tecnología proporcionados por Span son propiedad intelectual de la empresa.

## 6. Limitación de Responsabilidad

En la máxima medida permitida por la ley, Span no será responsable por:
- Daños indirectos, incidentales o consecuentes
- Pérdida de datos o ganancias
- Interrupciones del servicio

## 7. Terminación

Podemos suspender o terminar su cuenta si:
- Viola estos términos y condiciones
- Usa el servicio para fines ilegales
- No cumple con las obligaciones de pago

## 8. Modificaciones

Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor al ser publicadas.

## 9. Ley Aplicable

Estos términos se rigen por las leyes del país donde opera Span.

## 10. Contacto

Para preguntas sobre estos términos, contáctenos en:
Email: legal@span.com
Teléfono: +1 234 567 890

Fecha de última actualización: ' || CURRENT_DATE || ''
);

-- Verificar los registros insertados
SELECT * FROM paginas_legales ORDER BY actualizado_en DESC;
