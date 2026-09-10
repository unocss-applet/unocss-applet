export interface TransformerAttributifyOptions {
  /**
   * 属性名前缀
   * @default 'un-'
   */
  prefix?: string

  /**
   * 只匹配带前缀的属性
   *
   * @default false
   */
  prefixedOnly?: boolean

  /**
   * 支持无值的属性
   *
   * 例如
   * ```html
   * <div mt-2 />
   * ```
   *
   * @default true
   */
  nonValuedAttribute?: boolean

  /**
   * 提取时忽略的属性名列表
   */
  ignoreAttributes?: string[]

  /**
   * 属性编译进 `class=""` 后，把原属性删掉
   * @default true
   */
  deleteAttributes?: boolean

  /**
   * 忽略处理的标签名前缀列表。
   * 例如传 ['uni'] 会同时忽略 <UniIcon> 和 <uni-icon>
   * @default []
   */
  ignoreTagPrefixes?: string[]
}
