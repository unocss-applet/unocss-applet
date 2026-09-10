export interface TransformerHoverOptions {
  /**
   * 写进模板的 hover 属性名。
   *
   * Vue（uni-app / Taro-vue）用 `hover-class`；JSX/TSX（Taro React）用 `hoverClass`。
   * 只在框架要求别的属性名时才需要覆盖。
   *
   * @default 'hover-class'（Vue）/ 'hoverClass'（JSX）
   */
  hoverAttributeName?: string

  /**
   * 扫描 `hover:` 工具类的类名属性。
   *
   * @default 'class'（Vue）/ 'className'（JSX）
   */
  classAttributeName?: string
}
