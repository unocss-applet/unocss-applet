import { expect, it } from 'vitest'
import { encodeNonSpaceLatin } from '@unocss-applet/shared'

it('encodeNonSpaceLatin', () => {
  expect(encodeNonSpaceLatin('Hello, thank you, goodbye'))
    .toMatchInlineSnapshot(`"Hello, thank you, goodbye"`)
  expect(encodeNonSpaceLatin('你好，谢谢，再见'))
    .toMatchInlineSnapshot('"2032022909652923587435874652922087735265"')
  expect(encodeNonSpaceLatin('こんにちは、ありがとう、さようなら'))
    .toMatchInlineSnapshot(`"1237112435123951238512399122891235412426123641239212358122891237312424123581239412425"`)
  expect(encodeNonSpaceLatin('안녕하세요、감사합니다、안녕히 가세요'))
    .toMatchInlineSnapshot(`"505044539754616494645083612289440484932454633457684579612289505044539755176 440324946450836"`)
  expect(encodeNonSpaceLatin('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'))
    .toMatchInlineSnapshot('"Lorem ipsum dolor sit amet, consectetur adipiscing elit."')
  expect(encodeNonSpaceLatin('Здравствуйте、Спасибо、До свидания'))
    .toMatchInlineSnapshot(`"1047107610881072107410891090107410911081109010771228910571087107210891080107310861228910441086 10891074108010761072108510801103"`)
})
