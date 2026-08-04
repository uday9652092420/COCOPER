// Typography scale and font settings for the design system
export const typography = {
  fontFamily: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    h1: { fontSize: 40, lineHeight: 56, fontWeight: 700 },
    h2: { fontSize: 32, lineHeight: 44, fontWeight: 700 },
    h3: { fontSize: 24, lineHeight: 34, fontWeight: 600 },
    h4: { fontSize: 18, lineHeight: 28, fontWeight: 600 },
    body: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 400 },
  },
}

export type Typography = typeof typography
export default typography
