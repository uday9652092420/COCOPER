declare module '*.css'
declare module '*.scss'
declare module '*.less'

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.gif'

interface ImportMeta {
  env: Record<string, string>
}
