/**
 * @file ChartCard.tsx
 * @description Glass-effect card container used for embedding charts on the dashboard.
 */

import type React from 'react'
import { motion } from 'motion/react'

/**
 * @interface ChartCardProps
 * @description Props for the ChartCard component.
 */
export interface ChartCardProps {
  title: string
  children: React.ReactNode
}

/**
 * @component ChartCard
 * @description Animated card wrapper with subtle glass effect for charts.
 */
export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur"
  >
    <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
    </div>
    <div className="h-56 md:h-64">{children}</div>
  </motion.div>
)