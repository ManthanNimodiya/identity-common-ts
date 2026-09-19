import { test } from '@fast-check/vitest'
import * as fc from 'fast-check'
import { describe } from 'vitest'
import { cborDecode } from '../index'

describe('CBOR / COSE Fuzzing & Property-Based Testing', () => {
  test.prop([fc.uint8Array()])('fuzz cborDecode with arbitrary byte buffers without unhandled crashes', (bytes) => {
    try {
      cborDecode(bytes)
    } catch (_err) {
      // Decoding errors on malformed byte inputs are expected
    }
  })
})
