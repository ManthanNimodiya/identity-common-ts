import { test } from '@fast-check/vitest'
import * as fc from 'fast-check'
import { describe } from 'vitest'
import { DcqlQuery } from '../index'

describe('DCQL Fuzzing & Property-Based Testing', () => {
  test.prop([fc.jsonValue()])('fuzz DcqlQuery.parse with arbitrary JSON values without crashing', (json) => {
    try {
      DcqlQuery.parse(json as any)
    } catch (_err) {
      // Validation errors on malformed query objects are expected
    }
  })

  test.prop([fc.string()])('fuzz DcqlQuery.parse with arbitrary string inputs', (str) => {
    try {
      const input = JSON.parse(str)
      DcqlQuery.parse(input)
    } catch (_err) {
      // Expected parse or validation errors
    }
  })
})
