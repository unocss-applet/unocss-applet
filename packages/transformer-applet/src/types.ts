export interface TransformerAppletOptions {
  /**
   * Enable applet, only build applet should be true
   * e.g. In uniapp `enableApplet: !(process.env.UNI_PLATFORM === 'h5')` to disable for h5
   * @default true
   */
  enable?: boolean;

  /**
   * Prefix for compile class name
   * @default 'uno-'
   * e.g. bg-[hsl(2.7,81.9%,69.6%)] to uno-98db2v
   */
  classPrefix?: string;

  /**
   * Prefix for ignore compile string
   * If the string contains ignore prefix, it will be replaced with an empty string.
   * e.g. 'applet-ignore: bg-[hsl(2.7,81.9%,69.6%)]' to 'bg-[hsl(2.7,81.9%,69.6%)]'
   * @default 'applet-ignore:'
   */
  ignorePrefix?: string;

  /**
   * Hash function
   */
  hashFn?: (str: string) => string;

  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string;
}
