// Standard border radius tokens
export const radius = {
  small: 4,
  medium: 8,
  large: 16,
  xl: 24,
  round: 9999,
}

export const radiusPx = (value: number) => `${value}px`
export type Radius = typeof radius
export default radius
