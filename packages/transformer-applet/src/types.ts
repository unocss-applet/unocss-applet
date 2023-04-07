export interface TransformerAppletOptions {
  /**
   * Enable transformer applet
   * @default true
   */
  enable?: boolean

  /**
   * Prefix for compile class name
   * @default 'uno-'
   * e.g. bg-[hsl(2.7,81.9%,69.6%)] to uno-98db2v
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
