/**
 * @file SearchFilterPanel.tsx
 * @description Small search and filter panel used above lists/grids.
 */

import React, { useState } from "react";

/**
 * @interface SearchFilterPanelProps
 * @description Supports both old and new implementations.
 */
export interface SearchFilterPanelProps {
  // Old props (existing master screens)
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;

  // New props (Customer Master)
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

/**
 * @component SearchFilterPanel
 */
export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  placeholder,
  searchPlaceholder,

  onSearch,
  onClear,

  onSearchChange,
  onStatusChange,
}) => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  /**
   * Search
   */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const value = q.trim();

    // Old implementation
    onSearch?.(value);

    // New implementation
    onSearchChange?.(value);
  };

  /**
   * Clear
   */
  const handleClear = () => {
    setQ("");
    setStatus("");

    // Old implementation
    onClear?.();
    onSearch?.("");

    // New implementation
    onSearchChange?.("");
    onStatusChange?.("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={
          searchPlaceholder ??
          placeholder ??
          "Search..."
        }
        className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
      />

      {/* Optional Status Filter */}
      {onStatusChange && (
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            onStatusChange(e.target.value);
          }}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      )}

      <button
        type="submit"
        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
      >
        Search
      </button>

      <button
        type="button"
        onClick={handleClear}
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
      >
        Clear
      </button>
    </form>
  );
};

export default SearchFilterPanel;