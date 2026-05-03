/**
 * Convierte una URL de YouTube a su formato embed
 * @param url URL de YouTube (estándar o corta)
 * @returns URL embed o null si no es válida
 */
export function convertToYouTubeEmbed(url: string): string | null {
  if (!url) return null;

  // Patrones para URLs de YouTube (mejorados para manejar parámetros adicionales)
  const patterns = [
    // youtu.be/VIDEO_ID?params...
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|$)/,
    // youtube.com/watch?v=VIDEO_ID&params...
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})(?:&|$)/,
    // youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|$)/,
    // youtube.com/v/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?|$)/,
    // youtube.com/shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|$)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return null;
}

/**
 * Verifica si una URL es de YouTube
 * @param url URL a verificar
 * @returns true si es una URL de YouTube válida
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  
  const youtubePatterns = [
    /youtube\.com\/watch/i,
    /youtube\.com\/embed/i,
    /youtu\.be\//i,
    /youtube\.com\/shorts/i
  ];

  return youtubePatterns.some(pattern => pattern.test(url));
}

/**
 * Extrae el ID de un video de YouTube
 * @param url URL de YouTube
 * @returns ID del video o null si no se puede extraer
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
