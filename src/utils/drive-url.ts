/**
 * Utilidad para transformar URLs de Google Drive a URLs directas de imagen
 */

/**
 * Transforma una URL de Google Drive a una URL directa de imagen
 * @param url URL original de Google Drive
 * @returns URL directa de la imagen o URL original si no es de Google Drive
 */
export const getDirectDriveUrl = (url: string): string => {
  if (!url) return '';
  
  // Extraer ID de diferentes formatos de Google Drive
  // Formato: https://drive.google.com/open?id=ID
  const match = url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`;
  }
  
  // Formato alternativo: /file/d/ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://lh3.googleusercontent.com/u/0/d/${fileMatch[1]}`;
  }
  
  // Formato con parámetro: ?id=ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/u/0/d/${idMatch[1]}`;
  }
  
  // Si ya es una URL directa, retornarla
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  
  // Si no es de Google Drive, retornar URL original
  return url;
};
