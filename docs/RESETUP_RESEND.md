# Configuración de Resend - Solución a Error 403

## Problema Identificado

El error que estás experimentando:
```
Error de Resend: {
  statusCode: 403,
  name: 'validation_error',
  message: 'You can only send testing emails to your own email address (hamintonjair@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.'
}
```

## Causa

Estás usando la dirección de email de testing `onboarding@resend.dev` que Resend proporciona para desarrollo. Esta dirección solo permite enviar emails a tu dirección verificada (`hamintonjair@gmail.com`), no a otros destinatarios.

## Soluciones

### Opción 1: Verificar un Dominio (Recomendado para Producción)

1. **Ve a Resend Dashboard**: https://resend.com/domains
2. **Agrega tu dominio**: Ej: `span-business.com` o el dominio que uses
3. **Configura los registros DNS**:
   - DKIM
   - SPF
   - Return Path
4. **Espera la verificación** (puede tomar unos minutos)
5. **Actualiza las variables de entorno**:

```env
# En .env.local
RESEND_FROM=soporte@span-business.com  # Email con tu dominio verificado
```

### Opción 2: Usar Email de Testing (Solo para Desarrollo)

Si solo estás en desarrollo y quieres probar con tu email:

1. **Crea una función de envío condicional**:

```typescript
// En services/email.service.ts o donde uses Resend
const getEmailFrom = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const verifiedDomain = process.env.RESEND_FROM;
  
  if (isDevelopment || !verifiedDomain) {
    return 'onboarding@resend.dev'; // Solo para testing
  }
  
  return verifiedDomain; // Dominio verificado para producción
};

// Al enviar email:
const { data, error } = await resend.emails.send({
  from: `${titular} <${getEmailFrom()}>`,
  to: [emailDestino],
  subject: `${asunto} - ${titular}`,
  html: htmlContent,
});
```

2. **Limita destinatarios en desarrollo**:

```typescript
// Solo permite tu email en desarrollo con onboarding@resend.dev
const isDevelopment = process.env.NODE_ENV === 'development';
const isTestingEmail = getEmailFrom() === 'onboarding@resend.dev';

if (isTestingEmail && emailDestino !== 'hamintonjair@gmail.com') {
  console.log('⚠️ En desarrollo, solo se puede enviar a hamintonjair@gmail.com con email de testing');
  return {
    success: false,
    error: 'En desarrollo, solo se permite enviar al email del desarrollador'
  };
}
```

### Opción 3: Configuración Rápida para Testing

Modifica temporalmente los archivos para que solo envíen a tu email:

```typescript
// En cada archivo que usa Resend:
const emailDestino = process.env.NODE_ENV === 'development' 
  ? 'hamintonjair@gmail.com' 
  : emailDestinoOriginal;
```

## Archivos a Modificar

Los siguientes archivos usan `onboarding@resend.dev` y necesitan actualización:

1. `src/app/actions/admin.ts` (línea 452)
2. `src/app/actions/email-cierre.ts` (línea 249)
3. `src/services/email.service.ts` (líneas 177, 424, 897)

## Pasos Inmediatos

1. **Decide qué opción usar**: Dominio verificado vs testing limitado
2. **Si eliges dominio**: Configúralo en Resend.com primero
3. **Actualiza las variables de entorno**
4. **Modifica los archivos de envío de email**
5. **Prueba el registro de empresa**

## Recomendación

Para un entorno de producción, **usa la Opción 1** (verificar dominio). Para desarrollo rápido, la **Opción 2** es suficiente mientras configuras tu dominio.
