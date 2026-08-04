// 8px spacing system for consistent layout spacing
export const spacing = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s64: 64,
}

export const px = (value: number) => `${value}px`
export type Spacing = typeof spacing
export default spacing
