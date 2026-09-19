import { test } from '@fast-check/vitest'
import { hasher } from '@owf/crypto'
import * as fc from 'fast-check'
import { describe } from 'vitest'
import { decodeSdJwt } from '../index'

describe('SD-JWT Fuzzing & Property-Based Testing', () => {
  test.prop([fc.string()])(
    'fuzz decodeSdJwt with arbitrary strings without uncaught crashes',
    async (arbitraryString) => {
      try {
        await decodeSdJwt(arbitraryString, hasher)
      } catch (_err) {
        // Parser errors on malformed input are expected
      }
    }
  )

  test.prop([fc.uint8Array()])('fuzz decodeSdJwt with arbitrary byte buffers', async (bytes) => {
    try {
      const input = Buffer.from(bytes).toString('utf-8')
      await decodeSdJwt(input, hasher)
    } catch (_err) {
      // Parser errors on malformed input are expected
    }
  })
})
