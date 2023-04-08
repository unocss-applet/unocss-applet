export interface TransformerAppletOptions {
  /**
   * Enable transformer applet
   * @default true
   */
  enable?: boolean

  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$']
   */
  unsupportedChars?: string[]
}
