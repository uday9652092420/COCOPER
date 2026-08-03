/**
 * @file SearchFilterPanel.tsx
 * @description Small search and filter panel used above lists/grids.
 */

import type React from 'react'
import { useState } from 'react'

/**
 * @interface SearchFilterPanelProps
 * @description Props for SearchFilterPanel component.
 */
export interface SearchFilterPanelProps {
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
}

/**
 * @component SearchFilterPanel
 * @description Renders a search input with actions. Calls onSearch when user submits.
 */
export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({ placeholder = 'Search...', onSearch, onClear }) => {
  const [q, setQ] = useState('')

  /**
   * @function handleSubmit
   * @description Submit handler that forwards current query to parent.
   */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSearch(q.trim())
  }

  /**
   * @function handleClear
   * @description Clears input and notifies parent.
   */
  const handleClear = () => {
    setQ('')
    onClear?.()
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => handleSubmit()} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
          Search
        </button>
        <button type="button" onClick={handleClear} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
          Clear
        </button>
      </div>
    </form>
  )
}

export default SearchFilterPanel