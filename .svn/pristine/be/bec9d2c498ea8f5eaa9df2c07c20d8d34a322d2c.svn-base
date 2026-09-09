/**
 * @file format.ts
 * @description Utility helpers for formatting currency, dates and generic display values.
 */

/**
 * @description Format number as INR currency with grouping.
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)

/**
 * @description Format rounded line amounts as INR with Indian grouping and the requested suffix.
 */
export const formatAmount = (value: number): string =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value || 0))}/-`

/**
 * @description Format ISO date string into short human-readable format.
 */
export const formatDate = (value: string): string => {
  if (!value) return ''

  const trimmed = value.trim()

  const ddmmyyyy = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(trimmed)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    }
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed

  return parsed.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

/**
 * @description Capitalize first letter of a string.
 */
export const capitalize = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value