'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { crearJugador } from '@/lib/supabase/jugadores'
import { obtenerClubes } from '@/lib/supabase/clubes'
import { subirFotoJugador } from '@/lib/supabase/storage'
import type { Posicion, PosicionDetallada, PiePreferido, Categoria, Club, Jugador } from '@/types/database'
import { POSICION_LABELS, POSICION_DETALLADA_LABELS } from '@/lib/constants'
import { Upload } from 'lucide-react'

interface AddPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onPlayerCreated: (newPlayer: Jugador) => void
}

export function AddPlayerModal({ isOpen, onClose, onPlayerCreated }: AddPlayerModalProps) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)

  // Form State
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [nacionalidad, setNacionalidad] = useState('España')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [piePreferido, setPiePreferido] = useState<PiePreferido>('derecho')
  const [posicion, setPosicion] = useState<Posicion>('MC')
  const [posicionDetallada, setPosicionDetallada] = useState<PosicionDetallada>('MC_CEN')
  const [dorsal, setDorsal] = useState('')
  const [clubId, setClubId] = useState('')
  const [alturaCm, setAlturaCm] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Tercera RFEF')
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null)

  useEffect(() => {
    if (isOpen) {
      obtenerClubes().then(setClubes).catch(console.error)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !apellidos.trim()) return

    setLoading(true)
    try {
      // 1. Crear jugador en la base de datos
      const nuevo = await crearJugador({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        nacionalidad,
        fecha_nacimiento: fechaNacimiento || null,
        pie_preferido: piePreferido,
        posicion,
        posicion_detallada: posicionDetallada,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        club_id: clubId || null,
        foto_url: null,
        altura_cm: alturaCm ? parseInt(alturaCm, 10) : null,
        peso_kg: pesoKg ? parseInt(pesoKg, 10) : null,
        categoria,
        minutos_jugados: 0,
        partidos_analizados: 0,
        score_global: 70, // Score inicial neutro razonable
      })

      // 2. Si adjuntó foto, subirla a Supabase Storage (bucket: fotos-jugadores)
      if (archivoFoto) {
        try {
          const urlFoto = await subirFotoJugador(archivoFoto, nuevo.id)
          nuevo.foto_url = urlFoto
        } catch (storageErr) {
          console.error('Error al subir foto a Storage:', storageErr instanceof Error ? storageErr.message : storageErr)
        }
      }

      onPlayerCreated(nuevo)
      setNombre('')
      setApellidos('')
      setArchivoFoto(null)
      onClose()
    } catch (err) {
      console.error('Error al crear jugador:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }

  const posicionOptions = Object.entries(POSICION_LABELS).map(([val, label]) => ({
    value: val,
    label: `${val} — ${label}`,
  }))

  const posicionDetalladaOptions = Object.entries(POSICION_DETALLADA_LABELS).map(([val, label]) => ({
    value: val,
    label: `${val} — ${label}`,
  }))

  const clubOptions = clubes.map((c) => ({
    value: c.id,
    label: `${c.nombre} (${c.categoria})`,
  }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Jugador" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Marc"
            required
          />
          <Input
            label="Apellidos *"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            placeholder="Ej: Torrents Puig"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Posición Principal (Scoring) *"
            value={posicion}
            onChange={(e) => setPosicion(e.target.value as Posicion)}
            options={posicionOptions}
          />
          <Select
            label="Posición Detallada *"
            value={posicionDetallada}
            onChange={(e) => setPosicionDetallada(e.target.value as PosicionDetallada)}
            options={posicionDetalladaOptions}
          />
          <Select
            label="Pie Preferido *"
            value={piePreferido}
            onChange={(e) => setPiePreferido(e.target.value as PiePreferido)}
            options={[
              { value: 'derecho', label: 'Diestro' },
              { value: 'izquierdo', label: 'Zurdo' },
              { value: 'ambos', label: 'Ambidiestro' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Club"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            options={clubOptions}
            placeholder="Seleccionar club..."
          />
          <Select
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            options={[
              { value: 'Segunda RFEF', label: 'Segunda RFEF' },
              { value: 'Tercera RFEF', label: 'Tercera RFEF' },
              { value: 'Otra', label: 'Otra' },
            ]}
          />
          <Input
            label="Dorsal"
            type="number"
            value={dorsal}
            onChange={(e) => setDorsal(e.target.value)}
            placeholder="Ej: 10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Fecha Nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
          <Input
            label="Altura (cm)"
            type="number"
            value={alturaCm}
            onChange={(e) => setAlturaCm(e.target.value)}
            placeholder="Ej: 180"
          />
          <Input
            label="Peso (kg)"
            type="number"
            value={pesoKg}
            onChange={(e) => setPesoKg(e.target.value)}
            placeholder="Ej: 75"
          />
        </div>

        {/* Player Photo Upload */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Foto del Jugador (Supabase Storage: fotos-jugadores)
          </label>
          <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-600 dark:text-slate-400 transition-colors">
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{archivoFoto ? archivoFoto.name : 'Seleccionar fotografía (JPG/PNG)'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArchivoFoto(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Guardar Jugador
          </Button>
        </div>
      </form>
    </Modal>
  )
}
