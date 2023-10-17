import { expect, it } from 'vitest'
import { encodeNonLatin } from '../packages/shared/src'

it('encodeNonLatin', () => {
  expect(encodeNonLatin('你好，谢谢，再见(Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"2032022909652923587435874652922087735265(Hello,32thank32you,32goodbye)"')
  expect(encodeNonLatin('こんにちは、ありがとう、さようなら (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"123711243512395123851239912289123541242612364123921235812289123731242412358123941242532(Hello,32thank32you,32goodbye)"')
  expect(encodeNonLatin('안녕하세요、감사합니다、안녕히 가세요 (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"5050445397546164946450836122894404849324546334576845796122895050445397551763244032494645083632(Hello,32thank32you,32goodbye)"')
  expect(encodeNonLatin('Lorem ipsum dolor sit amet, consectetur adipiscing elit. (Latin text used as a placeholder)'))
    .toMatchInlineSnapshot('"Lorem32ipsum32dolor32sit32amet,32consectetur32adipiscing32elit.32(Latin32text32used32as32a32placeholder)"')
  expect(encodeNonLatin('Здравствуйте、Спасибо、До свидания (Hello, thank you, goodbye)'))
    .toMatchInlineSnapshot('"1047107610881072107410891090107410911081109010771228910571087107210891080107310861228910441086321089107410801076107210851080110332(Hello,32thank32you,32goodbye)"')
})
