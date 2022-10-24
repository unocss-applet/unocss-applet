export interface TransformerAttributifyOptions {
  /**
   * Enable attributify, only build applet should be true
   * e.g. In uniapp set `enable: !(process.env.UNI_PLATFORM === 'h5')` to disable for h5
   * @default true
   */
  enable?: boolean

  /**
    * @default 'un-'
    */
  prefix?: string

  /**
    * Only match for prefixed attributes
    *
    * @default false
    */
  prefixedOnly?: boolean

  /**
    * Support matching non-valued attributes
    *
    * For example
    * ```html
    * <div mt-2 />
    * ```
    *
    * @default true
    */
  nonValuedAttribute?: boolean

  /**
    * A list of attributes to be ignored from extracting.
    */
  ignoreAttributes?: string[]

  /**
   * Delete attributes that added in `class=""`
   * @default false
   */
  deleteClass?: boolean
}
