import { version } from '../../../package.json'

import defaultConfig from './config.ts?raw'
import defaultCSS from './preset.css?raw'
import defaultHTML from './preset.html?raw'

export const VERSION = version

export const defaultHTMLRaw = defaultHTML.trim()

export const defaultConfigRaw = defaultConfig.trim()

export const defaultCSSRaw = defaultCSS.trim()

export const customCSSLayerName = 'playground'

export const defaultOptions = '{}'

export const STORAGE_KEY = 'last-search'
