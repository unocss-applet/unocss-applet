import parserBabel from 'prettier/parser-babel'
import parserHTML from 'prettier/parser-html'
import parserCSS from 'prettier/parser-postcss'
import prettier from 'prettier/standalone'
import { toValue } from 'vue'

const plugins = {
  css: parserCSS,
  html: parserHTML,
  babel: parserBabel,
}

export function prettify(content: string, type: 'css' | 'babel' | 'html') {
  try {
    return prettier.format(toValue(content) || '', {
      parser: type,
      plugins: [plugins[type]],
      singleQuote: true,
      semi: false,
      printWidth: 100,
    })
  }
  catch (e: any) {
    console.error(e)
    return `/* Error on prettifying: ${e.message} */\n${toValue(content) || ''}`
  }
}
