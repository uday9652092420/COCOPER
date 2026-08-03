/**
 * @file LoadingSpinner.tsx
 * @description Reusable loading spinner component for async and mock-loading states.
 */

import type React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * @interface LoadingSpinnerProps
 * @description Props for LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  label?: string
}

/**
 * @component LoadingSpinner
 * @description Circular spinner with optional label.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin text-[#2E7D32]" />
    {label ? <span className="text-sm">{label}</span> : null}
  </div>
)