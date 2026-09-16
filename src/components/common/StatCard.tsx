/**
 * @file StatCard.tsx
 * @description Dashboard statistic card with glass effect and motion.
 */

import type React from 'react'
import { motion } from 'motion/react'

/**
 * @description Props for StatCard.
 */
export interface StatCardProps {
  label: string
  value: string
  icon?: React.ReactNode
  accentClassName?: string
}

/**
 * @component StatCard
 * @description Single KPI card with subtle hover animation.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accentClassName = 'bg-emerald-100 text-emerald-700',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
    className="relative overflow-hidden rounded-2xl border border-emerald-50 bg-white/80 p-3 shadow-sm backdrop-blur"
  >
    <div className="relative min-h-[4.25rem] min-w-0 pr-9">
      <div className="min-w-0">
        <p className="break-words text-xs font-medium leading-tight text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      </div>
      {icon ? (
        <div className={`absolute right-0 top-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs ${accentClassName}`}>
          {icon}
        </div>
      ) : null}
    </div>
    <div className="pointer-events-none absolute inset-x-10 bottom-0 h-10 rounded-full bg-gradient-to-t from-emerald-50/80 to-transparent" />
  </motion.div>
)
