/**
 * @file db-helpers.ts
 * @description Small shared helpers used by mock data generators.
 */

/**
 * @function daysFromNow
 * @description Return ISO date string offset by given days from today.
 */
export const daysFromNow = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/**
 * @function rand
 * @description Return random integer between min and max (inclusive).
 */
export const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min