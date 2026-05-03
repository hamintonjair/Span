'use server';

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { registrarLogAdmin } from '@/lib/auditAdmin';

export async function crearArticuloAyudaAction(formData: FormData, adminId: string) {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    const titulo = formData.get('titulo') as string;
    const categoria = formData.get('categoria') as string;
    const estado = formData.get('estado') as 'publicado' | 'borrador';
    const contenido = formData.get('contenido') as string;
    const video_url = formData.get('video_url') as string;
    const autor_id = formData.get('autor_id') as string;
    const imagen = formData.get('imagen') as File | null;
    const imagen_url = formData.get('imagen_url') as string | null;

    // Validar datos requeridos
    if (!titulo?.trim() || !contenido?.trim() || !autor_id) {
      console.error('❌ Datos incompletos:', { 
        titulo: !!titulo, 
        contenido: !!contenido, 
        autor_id: !!autor_id 
      });
      return {
        success: false,
        error: 'Todos los campos son requeridos'
      };
    }

    const supabase = createAdminClient();
    let finalImagenUrl = imagen_url?.trim() || null;

    // DEPURACIÓN: Listar todos los buckets visibles en este proyecto
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    

    if (listError) {
      console.error("❌ Error listando buckets:", listError);
    }

    // Subir imagen si se proporcionó un archivo
    if (imagen) {
      console.log('📤 Subiendo imagen al Storage:', { 
        name: imagen.name, 
        size: imagen.size, 
        type: imagen.type 
      });
      
      const fileExt = imagen.name.split('.').pop();
      const fileName = `${Date.now()}_${imagen.name}`;
      const filePath = `imagenes/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('articulos')
        .upload(filePath, imagen);
      
      if (uploadError) {
        console.error('❌ Error subiendo imagen:', uploadError);
        return {
          success: false,
          error: 'Error al subir la imagen: ' + uploadError.message
        };
      }
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('articulos')
        .getPublicUrl(filePath);
      
      finalImagenUrl = publicUrl;
      console.log('✅ Imagen subida exitosamente:', publicUrl);
    }

    const { data, error } = await supabase
      .from('articulos_ayuda')
      .insert({
        titulo: titulo.trim(),
        categoria,
        estado,
        contenido: contenido.trim(),
        video_url: video_url?.trim() || null,
        imagen_url: finalImagenUrl,
        autor_id: adminId,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select(`
        *,
        autor:usuarios_sistema(nombre)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando artículo:', error);
      return {
        success: false,
        error: error.message || 'Error al crear el artículo'
      };
    }


    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'CREAR_ARTICULO_AYUDA',
        modulo: 'Centro de Ayuda',
        detalles: { titulo: titulo.trim(), categoria }
      });
    } catch (e) {
      console.error('Error en auditoría (Crear Artículo):', e);
    }

    // Limpiar caché de la ruta del centro de ayuda
    revalidatePath('/admin/centro-ayuda');

    return {
      success: true,
      data: data
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en crearArticuloAyudaAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al crear el artículo'
    };
  }
}

export async function actualizarArticuloAyudaAction(formData: FormData, adminId: string) {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    const id = formData.get('id') as string;
    const titulo = formData.get('titulo') as string;
    const categoria = formData.get('categoria') as string;
    const estado = formData.get('estado') as 'publicado' | 'borrador';
    const contenido = formData.get('contenido') as string;
    const video_url = formData.get('video_url') as string;
    const imagen = formData.get('imagen') as File | null;
    const imagen_url = formData.get('imagen_url') as string | null;

    // Validar datos requeridos
    if (!id || !titulo?.trim() || !contenido?.trim()) {
      console.error('❌ Datos incompletos:', { 
        id: !!id,
        titulo: !!titulo, 
        contenido: !!contenido
      });
      return {
        success: false,
        error: 'El ID, título y contenido son requeridos'
      };
    }

    const supabase = createAdminClient();
    let finalImagenUrl = imagen_url?.trim() || null;

    // Subir imagen si se proporcionó un archivo
    if (imagen) {
      console.log('📤 Subiendo imagen al Storage:', { 
        name: imagen.name, 
        size: imagen.size, 
        type: imagen.type 
      });
      
      const fileExt = imagen.name.split('.').pop();
      const fileName = `${Date.now()}_${imagen.name}`;
      const filePath = `imagenes/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('articulos')
        .upload(filePath, imagen);
      
      if (uploadError) {
        console.error('❌ Error subiendo imagen:', uploadError);
        return {
          success: false,
          error: 'Error al subir la imagen: ' + uploadError.message
        };
      }
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('articulos')
        .getPublicUrl(filePath);
      
      finalImagenUrl = publicUrl;
      console.log('✅ Imagen subida exitosamente:', publicUrl);
    }

    const { data, error } = await supabase
      .from('articulos_ayuda')
      .update({
        titulo: titulo.trim(),
        categoria,
        estado,
        contenido: contenido.trim(),
        video_url: video_url?.trim() || null,
        imagen_url: finalImagenUrl,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        autor:usuarios_sistema(nombre)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando artículo:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el artículo'
      };
    }

    console.log('✅ Artículo actualizado exitosamente:', data);

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ACTUALIZAR_ARTICULO_AYUDA',
        modulo: 'Centro de Ayuda',
        detalles: { articulo_id: id, titulo_actualizado: titulo.trim() }
      });
    } catch (e) {
      console.error('Error en auditoría (Actualizar Artículo):', e);
    }

    // Limpiar caché de la ruta del centro de ayuda
    revalidatePath('/admin/centro-ayuda');

    return {
      success: true,
      data: data
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en actualizarArticuloAyudaAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al actualizar el artículo'
    };
  }
}

// Función auxiliar para extraer nombre de archivo de URL de Supabase Storage
function extractFileNameFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    // URL de Supabase Storage: https://project.supabase.co/storage/v1/object/public/bucket/path/filename
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extraer el último segmento del pathname
    const segments = pathname.split('/');
    const fileName = segments[segments.length - 1];
    
    return fileName || null;
  } catch (error) {
    console.error('Error extrayendo nombre de archivo:', error);
    return null;
  }
}

// Server Action para eliminar artículo
export async function eliminarArticuloAction(id: string, imagenUrl: string | null) {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    console.log('🗑️ Eliminando artículo:', { id, imagenUrl });

    // Validar ID
    if (!id) {
      console.error('❌ ID no proporcionado');
      return {
        success: false,
        error: 'ID del artículo es requerido'
      };
    }

    const supabase = createAdminClient();

    // Eliminar imagen del bucket si existe
    if (imagenUrl) {
      const fileName = extractFileNameFromUrl(imagenUrl);
      if (fileName) {
        console.log('🗑️ Eliminando imagen del bucket:', fileName);
        
        const { error: deleteError } = await supabase.storage
          .from('articulos')
          .remove([fileName]);
        
        if (deleteError) {
          console.error('❌ Error eliminando imagen del bucket:', deleteError);
          // No fallamos la eliminación si la imagen no se puede borrar
          console.warn('⚠️ Continuando con eliminación del registro...');
        } else {
          console.log('✅ Imagen eliminada del bucket exitosamente');
        }
      }
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('articulos_ayuda')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error eliminando artículo:', deleteError);
      return {
        success: false,
        error: deleteError.message || 'Error al eliminar el artículo'
      };
    }

    console.log('✅ Artículo eliminado exitosamente');
    
    // Limpiar caché de la ruta del centro de ayuda
    revalidatePath('/admin/centro-ayuda');
    
    return {
      success: true,
      message: 'Artículo eliminado exitosamente'
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en eliminarArticuloAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al eliminar el artículo'
    };
  }
}

export async function eliminarArticuloAyudaAction(id: string, adminId: string) {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    console.log('🔍 Eliminando artículo de ayuda:', { id });

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('articulos_ayuda')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando artículo:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar el artículo'
      };
    }

    console.log('✅ Artículo eliminado exitosamente');

    // Registrar log de auditoría global
    try {
      await registrarLogAdmin({
        usuario_id: adminId,
        accion: 'ELIMINAR_ARTICULO_AYUDA',
        modulo: 'Centro de Ayuda',
        detalles: { articulo_id: id }
      });
    } catch (e) {
      console.error('Error en auditoría (Eliminar Artículo):', e);
    }

    // Limpiar caché de la ruta del centro de ayuda
    revalidatePath('/admin/centro-ayuda');

    return {
      success: true
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en eliminarArticuloAyudaAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al eliminar el artículo'
    };
  }
}

export async function obtenerArticulosAyudaAction() {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    console.log('🔍 Obteniendo artículos de ayuda');

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('articulos_ayuda')
      .select(`
        *,
        autor:usuarios_sistema!articulos_ayuda_autor_id_fkey(nombre)
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo artículos:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los artículos'
      };
    }

    console.log('✅ Artículos obtenidos exitosamente:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en obtenerArticulosAyudaAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al obtener los artículos'
    };
  }
}

// Server Action para obtener artículos publicados (para clientes)
export async function obtenerArticulosPublicadosAction() {
  try {
    // Desactivar caché para datos en tiempo real
    noStore();
    
    console.log('🔍 Obteniendo artículos publicados para clientes');

    const supabase = createClient();

    const { data, error } = await supabase
      .from('articulos_ayuda')
      .select(`
        *,
        autor:usuarios_sistema!articulos_ayuda_autor_id_fkey(nombre)
      `)
      .eq('estado', 'publicado')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo artículos publicados:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los artículos'
      };
    }

    console.log('✅ Artículos publicados obtenidos exitosamente:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ Error inesperado en obtenerArticulosPublicadosAction:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al obtener los artículos'
    };
  }
}
