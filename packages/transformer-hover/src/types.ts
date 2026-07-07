export interface TransformerHoverOptions {
  /**
   * Attribute name written into the template for hover utilities.
   *
   * Vue (uni-app / Taro-vue) uses `hover-class`; JSX/TSX (Taro React) uses `hoverClass`.
   * Override only if your framework expects a different attribute name.
   *
   * @default 'hover-class' (Vue) / 'hoverClass' (JSX)
   */
  hoverAttributeName?: string

  /**
   * Class attribute name to scan for `hover:` utilities.
   *
   * @default 'class' (Vue) / 'className' (JSX)
   */
  classAttributeName?: string
}
