export interface TransformerAppletOptions {
  /**
   * Prefix for compile class name
   * @default 'uno-'
   */
  classPrefix?: string

  /**
   * Hash function
   */
  hashFn?: (str: string) => string

  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string
}
