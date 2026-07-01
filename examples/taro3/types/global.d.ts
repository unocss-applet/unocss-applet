/// <reference types="@tarojs/taro" />

import type { AttributifyAttributes } from 'unocss/preset-attributify'

// Taro 组件 Props 不继承 React.HTMLAttributes，UnoCSS 文档面向原生 HTML 的
// `declare module 'react'` 方案在此无效。所有 Taro 组件 Props 均继承 StandardProps，
// 扩展此基类即可让全部组件支持 attributify 属性。
declare module '@tarojs/components' {
  interface StandardProps extends AttributifyAttributes {}
}

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE 内置环境变量, 会影响到最终构建生成产物 */
    NODE_ENV: 'development' | 'production'
    /** 当前构建的平台 */
    TARO_ENV: 'ascf' | 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
    /**
     * 当前构建的小程序 appid
     * @description 若不同环境有不同的小程序，可通过在 env 文件中配置环境变量`TARO_APP_ID`来方便快速切换 appid， 而不必手动去修改 dist/project.config.json 文件
     * @see https://taro-docs.jd.com/docs/next/env-mode-config#特殊环境变量-taro_app_id
     */
    TARO_APP_ID: string
  }
}
