/**
 * @file NotFoundPage.tsx
 * @description Generic 404 error page.
 */

import type React from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Ghost } from 'lucide-react'

/**
 * @component NotFoundPage
 * @description Shown when user navigates to an unknown route.
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/40 to-lime-50/60 px-4">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white/90 p-6 text-center shadow-xl backdrop-blur">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Ghost className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="text-xs text-slate-500">
          The page you are looking for does not exist or you do not have access to it.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage

