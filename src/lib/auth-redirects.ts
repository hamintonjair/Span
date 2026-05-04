/**
 * Configuración de redirecciones de autenticación según el entorno
 */

export const getAuthRedirectUrl = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // En producción, usar la URL de span-business.com
  if (isProduction) {
    return 'https://span-business.com';
  }
  
  // En desarrollo y otros entornos, usar localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const getLoginRedirectUrl = (defaultRedirect: string = '/dashboard'): string => {
  const baseUrl = getAuthRedirectUrl();
  return `${baseUrl}${defaultRedirect}`;
};

export const getCallbackUrl = (): string => {
  const baseUrl = getAuthRedirectUrl();
  return `${baseUrl}/auth/callback`;
};

// URLs específicas para Supabase Auth
export const supabaseAuthConfig = {
  redirectTo: getAuthRedirectUrl(),
  // Otras configuraciones de auth si son necesarias
};
