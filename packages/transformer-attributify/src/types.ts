export interface TransformerAttributifyOptions {
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
   * @default true
   */
  deleteAttributes?: boolean

  /**
   * A list of tag prefixes to be ignored from processing.
   * For example, ['uni'] will ignore both <UniIcon> and <uni-icon>
   * @default []
   */
  ignoreTagPrefixes?: string[]
}
