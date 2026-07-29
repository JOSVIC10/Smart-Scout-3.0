// ============================================================================
// Smart Scout 3.0 — Servicio Supabase: Alineaciones Guardadas
// ============================================================================

import { supabase } from './client'
import type { AlineacionGuardada, SlotTactico } from '@/types/database'

export async function obtenerAlineaciones(): Promise<AlineacionGuardada[]> {
  const { data, error } = await supabase
    .from('alineaciones_guardadas')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as AlineacionGuardada[]) ?? []
}

export async function crearAlineacion(
  alineacion: Omit<AlineacionGuardada, 'id' | 'created_at' | 'updated_at'>
): Promise<AlineacionGuardada> {
  const { data, error } = await supabase
    .from('alineaciones_guardadas')
    .insert(alineacion)
    .select()
    .single()

  if (error) throw error
  return data as AlineacionGuardada
}

export async function actualizarAlineacion(
  id: string,
  campos: Partial<Omit<AlineacionGuardada, 'id' | 'created_at' | 'updated_at'>>
): Promise<AlineacionGuardada> {
  const { data, error } = await supabase
    .from('alineaciones_guardadas')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as AlineacionGuardada
}

export async function eliminarAlineacion(id: string): Promise<void> {
  const { error } = await supabase
    .from('alineaciones_guardadas')
    .delete()
    .eq('id', id)

  if (error) throw error
}
