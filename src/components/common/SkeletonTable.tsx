/**
 * @file SkeletonTable.tsx
 * @description Skeleton loader placeholder for table views.
 */

import type React from 'react'

/**
 * @description Grey pulsing skeleton rows mimicking a table.
 */
export const SkeletonTable: React.FC&lt;{ rows?: number }&gt; = ({ rows = 5 }) =&gt; (
  &lt;div className="space-y-2 py-4"&gt;
    {Array.from({ length: rows }).map((_, idx) =&gt; (
      &lt;div
        // eslint-disable-next-line react/no-array-index-key
        key={idx}
        className="h-9 w-full animate-pulse rounded-md bg-slate-100"
      /&gt;
    ))}
  &lt;/div&gt;
)