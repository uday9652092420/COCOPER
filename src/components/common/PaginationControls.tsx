import React from 'react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
  const safeTotalPages = Math.max(totalPages, 1)
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
      <span>Page {safeCurrentPage} of {safeTotalPages}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="rounded-md border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: safeTotalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={safeCurrentPage === page ? 'page' : undefined}
            className={`min-w-8 rounded-md px-2 py-1.5 ${safeCurrentPage === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          className="rounded-md border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PaginationControls