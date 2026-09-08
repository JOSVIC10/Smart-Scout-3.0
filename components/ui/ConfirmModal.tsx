'use client'

import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading: externalLoading = false,
}: ConfirmModalProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading

  const handleConfirm = async () => {
    setInternalLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error('Error en confirmación:', err)
    } finally {
      setInternalLoading(false)
    }
  }

  const iconBg = {
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    primary: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 ${iconBg}`}>
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
            {message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            loading={isLoading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white border-red-500' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
