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
    className="relative overflow-hidden rounded-3xl border border-emerald-50 bg-white/80 p-4 shadow-sm backdrop-blur"
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      </div>
      {icon ? (
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs ${accentClassName}`}>
          {icon}
        </div>
      ) : null}
    </div>
    <div className="pointer-events-none absolute inset-x-10 bottom-0 h-10 rounded-full bg-gradient-to-t from-emerald-50/80 to-transparent" />
  </motion.div>
)
