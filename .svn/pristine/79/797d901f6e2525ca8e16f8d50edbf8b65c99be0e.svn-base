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
 * @description Format ISO date string into short human-readable format.
 */
export const formatDate = (value: string): string => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
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