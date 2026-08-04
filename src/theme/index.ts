import colors from './colors'
import spacing from './spacing'
import radius from './radius'
import typography from './typography'
import shadows from './shadows'

export { colors, spacing, radius, typography, shadows }
export type Theme = {
  colors: typeof colors
  spacing: typeof spacing
  radius: typeof radius
  typography: typeof typography
  shadows: typeof shadows
}

export const theme: Theme = { colors, spacing, radius, typography, shadows }

export function installCssVars() {
  const root = document.documentElement

  root.style.setProperty('--primary', '177 71% 21%')
  root.style.setProperty('--primary-dark', '177 78% 12%')
  root.style.setProperty('--primary-light', '180 67% 29%')
  root.style.setProperty('--accent', '164 58% 42%')
  root.style.setProperty('--success', '140 57% 49%')
  root.style.setProperty('--warning', '45 100% 48%')
  root.style.setProperty('--danger', '8 74% 56%')

  root.style.setProperty('--background', '180 20% 97%')
  root.style.setProperty('--card', '0 0% 100%')
  root.style.setProperty('--section', '180 40% 94%')

  root.style.setProperty('--heading', '177 78% 12%')
  root.style.setProperty('--body', '184 7% 36%')
  root.style.setProperty('--muted', '184 7% 48%')
  root.style.setProperty('--white', '0 0% 100%')

  root.style.setProperty('--border-light', '184 41% 89%')
  root.style.setProperty('--border', '188 34% 82%')

  root.style.setProperty('--primary-foreground', '0 0% 100%')
  root.style.setProperty('--secondary', 'var(--accent)')
  root.style.setProperty('--muted-foreground', 'var(--heading)')
  root.style.setProperty('--card-foreground', 'var(--heading)')
}
