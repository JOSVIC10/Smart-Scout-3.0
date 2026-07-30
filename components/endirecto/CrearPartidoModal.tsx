'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { obtenerClubes, crearClub } from '@/lib/supabase/clubes'
import { crearPartidoDirecto } from '@/lib/supabase/endirecto'
import type { Categoria, Club, Partido } from '@/types/database'
import { Plus, Calendar, Trophy, AlertCircle } from 'lucide-react'

interface CrearPartidoModalProps {
  isOpen: boolean
  onClose: () => void
  onPartidoCreado: (nuevoPartido: Partido) => void
}

export function CrearPartidoModal({ isOpen, onClose, onPartidoCreado }: CrearPartidoModalProps) {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loadingClubes, setLoadingClubes] = useState(false)

  // Form State
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [clubLocalId, setClubLocalId] = useState('')
  const [clubVisitanteId, setClubVisitanteId] = useState('')

  // Quick Club Creation State if user types custom names
  const [nuevoLocalNombre, setNuevoLocalNombre] = useState('')
  const [nuevoVisitanteNombre, setNuevoVisitanteNombre] = useState('')
  const [crearLocalNuevo, setCrearLocalNuevo] = useState(false)
  const [crearVisitanteNuevo, setCrearVisitanteNuevo] = useState(false)

  const [competicion, setCompeticion] = useState('')
  const [jornada, setJornada] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Tercera RFEF')
  const [notas, setNotas] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setLoadingClubes(true)
      obtenerClubes()
        .then(data => {
          setClubes(data)
          if (data.length >= 2) {
            setClubLocalId(data[0].id)
            setClubVisitanteId(data[1].id)
          } else if (data.length === 1) {
            setClubLocalId(data[0].id)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingClubes(false))
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    let finalLocalId = clubLocalId
    let finalVisitanteId = clubVisitanteId

    // Validation
    if (crearLocalNuevo && !nuevoLocalNombre.trim()) {
      setErrorMsg('Escribe el nombre del Club Local')
      return
    }
    if (!crearLocalNuevo && !finalLocalId) {
      setErrorMsg('Selecciona un Club Local')
      return
    }
    if (crearVisitanteNuevo && !nuevoVisitanteNombre.trim()) {
      setErrorMsg('Escribe el nombre del Club Visitante')
      return
    }
    if (!crearVisitanteNuevo && !finalVisitanteId) {
      setErrorMsg('Selecciona un Club Visitante')
      return
    }
    if (!crearLocalNuevo && !crearVisitanteNuevo && finalLocalId === finalVisitanteId) {
      setErrorMsg('El club local y visitante deben ser distintos')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create local club on the fly if needed
      if (crearLocalNuevo && nuevoLocalNombre.trim()) {
        const clubLocalObj = await crearClub({
          nombre: nuevoLocalNombre.trim(),
          ciudad: null,
          provincia: null,
          categoria,
          escudo_url: null,
        })
        finalLocalId = clubLocalObj.id
      }

      // 2. Create visitante club on the fly if needed
      if (crearVisitanteNuevo && nuevoVisitanteNombre.trim()) {
        const clubVisitanteObj = await crearClub({
          nombre: nuevoVisitanteNombre.trim(),
          ciudad: null,
          provincia: null,
          categoria,
          escudo_url: null,
        })
        finalVisitanteId = clubVisitanteObj.id
      }

      // 3. Insert new Match
      const nuevoPartido = await crearPartidoDirecto({
        fecha,
        club_local_id: finalLocalId,
        club_visitante_id: finalVisitanteId,
        jornada: jornada ? parseInt(jornada) : null,
        competicion: competicion.trim() || null,
        categoria,
        resultado: null,
        notas: notas.trim() || null,
      })

      onPartidoCreado(nuevoPartido)
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error al crear el partido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const clubOptions = clubes.map(c => ({ value: c.id, label: `${c.nombre} (${c.categoria})` }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Partido para En Directo" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fecha y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha del Partido *"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <Select
            label="Categoría *"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            options={[
              { value: 'Segunda RFEF', label: 'Segunda RFEF' },
              { value: 'Tercera RFEF', label: 'Tercera RFEF' },
              { value: 'Otra', label: 'Otra' },
            ]}
          />
        </div>

        {/* Club Local */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Club Local (Casa) *
            </label>
            <button
              type="button"
              onClick={() => setCrearLocalNuevo(!crearLocalNuevo)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline transition-colors"
            >
              {crearLocalNuevo ? '← Seleccionar club existente' : '+ Crear club nuevo'}
            </button>
          </div>

          {crearLocalNuevo ? (
            <Input
              label="Nombre del Club Local *"
              placeholder="Ej: CD Montblanc"
              value={nuevoLocalNombre}
              onChange={(e) => setNuevoLocalNombre(e.target.value)}
            />
          ) : (
            <Select
              label="Seleccionar Club Local *"
              value={clubLocalId}
              onChange={(e) => setClubLocalId(e.target.value)}
              options={[
                { value: '', label: '-- Seleccionar --' },
                ...clubOptions,
              ]}
              disabled={loadingClubes}
            />
          )}
        </div>

        {/* Club Visitante */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Club Visitante (Rival) *
            </label>
            <button
              type="button"
              onClick={() => setCrearVisitanteNuevo(!crearVisitanteNuevo)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline transition-colors"
            >
              {crearVisitanteNuevo ? '← Seleccionar club existente' : '+ Crear club nuevo'}
            </button>
          </div>

          {crearVisitanteNuevo ? (
            <Input
              label="Nombre del Club Visitante *"
              placeholder="Ej: Athletic Pradoviejo"
              value={nuevoVisitanteNombre}
              onChange={(e) => setNuevoVisitanteNombre(e.target.value)}
            />
          ) : (
            <Select
              label="Seleccionar Club Visitante *"
              value={clubVisitanteId}
              onChange={(e) => setClubVisitanteId(e.target.value)}
              options={[
                { value: '', label: '-- Seleccionar --' },
                ...clubOptions,
              ]}
              disabled={loadingClubes}
            />
          )}
        </div>

        {/* Competición y Jornada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Competición (opcional)"
            placeholder="Ej: Liga Tercera RFEF Grupo 4"
            value={competicion}
            onChange={(e) => setCompeticion(e.target.value)}
          />
          <Input
            label="Jornada (opcional)"
            type="number"
            placeholder="Ej: 15"
            value={jornada}
            onChange={(e) => setJornada(e.target.value)}
          />
        </div>

        {/* Notas */}
        <Input
          label="Notas adicionales (opcional)"
          placeholder="Ej: Partido decisivo de ida, campo de césped artificial..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Crear y Seleccionar Partido
          </Button>
        </div>
      </form>
    </Modal>
  )
}
