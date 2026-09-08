import React from 'react'
import { clsx } from 'clsx'

interface Option {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  placeholder?: string
}

export function Select({ label, options, error, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 px-3 py-2 transition-colors cursor-pointer dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100 shadow-xs',
          error && 'border-red-500/80 focus:ring-red-500/40',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  )
}
