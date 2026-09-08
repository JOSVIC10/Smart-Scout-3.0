import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  onClick?: () => void
}

export function Card({ children, className, glass = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl transition-all duration-200',
        glass
          ? 'glass-card'
          : 'bg-white border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-xl',
        onClick &&
          'cursor-pointer hover:border-emerald-500/40 hover:shadow-md dark:hover:border-slate-700 dark:hover:shadow-2xl hover:translate-y-[-1px]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('p-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/60', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx('text-xs text-slate-500 dark:text-slate-400 mt-1', className)}>{children}</p>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('p-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('p-5 pt-3 border-t border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between', className)}>{children}</div>
}
