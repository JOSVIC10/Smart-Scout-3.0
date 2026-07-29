// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Vídeos (subida y gestión)
// ============================================================================

import { supabase } from './client'
import type { Video } from '@/types/database'

const BUCKET_VIDEOS = 'videos'

// ---------------------------------------------------------------------------
// CRUD de registros de vídeo
// ---------------------------------------------------------------------------

/**
 * Registra un vídeo de YouTube en la tabla `videos`.
 * El vídeo no se almacena localmente; solo se guarda la URL de referencia.
 */
export async function registrarVideoYoutube(
  url: string,
  titulo: string,
  partidoId?: string | null
): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      titulo,
      url,
      tipo_fuente: 'youtube' as const,
      partido_id: partidoId ?? null,
      duracion_seg: null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Video
}

/**
 * Sube un archivo de vídeo a Supabase Storage y registra el registro en `videos`.
 * Devuelve el vídeo creado con su URL pública.
 *
 * @param archivo - File object del input de tipo file
 * @param titulo - Título descriptivo del vídeo
 * @param partidoId - ID del partido al que pertenece (opcional)
 * @param onProgress - Callback de progreso (0-100), no disponible en la API actual de Supabase
 */
export async function subirVideoStorage(
  archivo: File,
  titulo: string,
  partidoId?: string | null
): Promise<Video> {
  const extension = archivo.name.split('.').pop() ?? 'mp4'
  const nombreArchivo = `${Date.now()}_${archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // 1. Subir al bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_VIDEOS)
    .upload(nombreArchivo, archivo, {
      cacheControl: '3600',
      upsert: false,
      contentType: archivo.type || `video/${extension}`,
    })

  if (uploadError) throw uploadError

  // 2. Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET_VIDEOS)
    .getPublicUrl(nombreArchivo)

  // 3. Registrar en tabla videos
  const { data, error: dbError } = await supabase
    .from('videos')
    .insert({
      titulo,
      url: urlData.publicUrl,
      tipo_fuente: 'storage' as const,
      partido_id: partidoId ?? null,
      duracion_seg: null,
    })
    .select()
    .single()

  if (dbError) {
    // Si falla el registro en BD, intentar borrar el archivo del storage
    await supabase.storage.from(BUCKET_VIDEOS).remove([nombreArchivo])
    throw dbError
  }

  return data as Video
}

/**
 * Elimina un vídeo de la base de datos.
 * Si el vídeo estaba en Storage, también elimina el archivo.
 */
export async function eliminarVideo(video: Video): Promise<void> {
  // 1. Eliminar registro de BD (las acciones etiquetadas tienen CASCADE o SET NULL)
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', video.id)

  if (error) throw error

  // 2. Si el vídeo estaba en Storage, eliminar el archivo físico
  if (video.tipo_fuente === 'storage' && video.url) {
    try {
      // Extraer el path relativo de la URL pública
      const url = new URL(video.url)
      const pathParts = url.pathname.split(`/${BUCKET_VIDEOS}/`)
      if (pathParts.length > 1) {
        await supabase.storage.from(BUCKET_VIDEOS).remove([pathParts[1]])
      }
    } catch {
      // No es crítico si falla el borrado del archivo en storage
      console.warn('No se pudo eliminar el archivo de Storage:', video.url)
    }
  }
}

/**
 * Obtiene la URL firmada de un vídeo privado (si el bucket no es público).
 * Para buckets públicos, usar directamente video.url.
 */
export async function obtenerUrlFirmadaVideo(
  nombreArchivo: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_VIDEOS)
    .createSignedUrl(nombreArchivo, expiresIn)

  if (error) throw error
  return data.signedUrl
}
