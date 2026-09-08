'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { crearClub } from '@/lib/supabase/clubes'
import { subirEscudoClub } from '@/lib/supabase/storage'
import type { Categoria, Club } from '@/types/database'
import { Upload, Shield } from 'lucide-react'

interface AddClubModalProps {
  isOpen: boolean
  onClose: () => void
  onClubCreated: (nuevoClub: Club) => void
}

export function AddClubModal({ isOpen, onClose, onClubCreated }: AddClubModalProps) {
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Tercera RFEF')
  const [archivoEscudo, setArchivoEscudo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setLoading(true)
    try {
      // 1. Crear club sin escudo primero para obtener ID
      const nuevo = await crearClub({
        nombre: nombre.trim(),
        ciudad: ciudad.trim() || null,
        provincia: provincia.trim() || null,
        categoria,
        escudo_url: null,
      })

      // 2. Si seleccionó un archivo de escudo, subirlo a Supabase Storage
      if (archivoEscudo) {
        try {
          const urlEscudo = await subirEscudoClub(archivoEscudo, nuevo.id)
          // Actualizar club con la URL del escudo
          nuevo.escudo_url = urlEscudo
        } catch (storageErr) {
          console.error('Error al subir escudo a Storage:', storageErr)
        }
      }

      onClubCreated(nuevo)
      setNombre('')
      setCiudad('')
      setProvincia('')
      setArchivoEscudo(null)
      onClose()
    } catch (err) {
      console.error('Error al crear club:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Club" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del Club *"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: UE Olot"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Ciudad"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej: Olot"
          />
          <Input
            label="Provincia"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            placeholder="Ej: Girona"
          />
        </div>

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

        {/* Upload Escudo File Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Escudo del Club (Supabase Storage)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 cursor-pointer text-xs text-slate-600 dark:text-slate-400 transition-colors">
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{archivoEscudo ? archivoEscudo.name : 'Seleccionar imagen de escudo (PNG/JPG)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoEscudo(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Guardar Club
          </Button>
        </div>
      </form>
    </Modal>
  )
}
