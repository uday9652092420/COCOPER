/**
 * @file PageHeader.tsx
 * @description Standard page header with title and breadcrumb.
 */

import type React from 'react'

/**
 * @interface PageHeaderProps
 * @description Props for PageHeader.
 */
export interface PageHeaderProps {
  title: string
  breadcrumb: string[]
  extra?: React.ReactNode
}

/**
 * @component PageHeader
 * @description Displays page title and breadcrumb navigation trail.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumb, extra }) => (
  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {breadcrumb.map((crumb, idx) => (
          <span key={crumb} className="flex items-center gap-2">
            <span>{crumb}</span>
            {idx < breadcrumb.length - 1 ? <span className="text-slate-300">/</span> : null}
          </span>
        ))}
      </div>
      <h1 className="mt-1 text-xl font-semibold text-slate-900 md:text-2xl">{title}</h1>
    </div>
    {extra ? <div className="flex items-center gap-2">{extra}</div> : null}
  </div>
)