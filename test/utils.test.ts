import { expect, it } from 'vitest'
import { encodeNonSpaceLatin } from '../packages/shared/src'

it('encodeNonSpaceLatin', () => {
  expect(encodeNonSpaceLatin('你好，谢谢，再见(Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"2032022909652923587435874652922087735265(Hello, thank you, goodbye)"')
  expect(encodeNonSpaceLatin('こんにちは、ありがとう、さようなら (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"1237112435123951238512399122891235412426123641239212358122891237312424123581239412425 (Hello, thank you, goodbye)"')
  expect(encodeNonSpaceLatin('안녕하세요、감사합니다、안녕히 가세요 (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"505044539754616494645083612289440484932454633457684579612289505044539755176 440324946450836 (Hello, thank you, goodbye)"')
  expect(encodeNonSpaceLatin('Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Latin text used as a placeholder)'))
    .toMatchInlineSnapshot('"Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Latin text used as a placeholder)"')
  expect(encodeNonSpaceLatin('Здравствуйте、Спасибо、До свидания (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"1047107610881072107410891090107410911081109010771228910571087107210891080107310861228910441086 10891074108010761072108510801103 (Hello, thank you, goodbye)"')
})
