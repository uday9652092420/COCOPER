/**
 * @file EmptyState.tsx
 * @description Generic empty data illustration and message.
 */

import type React from 'react'

/**
 * @description Shows illustration and helper text when there is no data.
 */
export const EmptyState: React.FC&lt;{ title: string; description?: string }&gt; = ({
  title,
  description,
}) =&gt; (
  &lt;div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-slate-500"&gt;
    &lt;div className="h-32 w-32 overflow-hidden rounded-full bg-slate-50"&gt;
      &lt;img
        src="https://pub-cdn.sider.ai/u/U0VEH8VKN6G/web-coder/6a61c625388e2f3cd0e01060/resource/92b948a7-dc95-41ec-a0af-f233aed657c7.jpg"
        alt="Empty data"
        className="h-full w-full object-cover"
      /&gt;
    &lt;/div&gt;
    &lt;p className="text-sm font-medium"&gt;{title}&lt;/p&gt;
    {description ? &lt;p className="max-w-md text-xs text-slate-400"&gt;{description}&lt;/p&gt; : null}
  &lt;/div&gt;
)