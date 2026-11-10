import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redact } from './redact.mjs'
test('redacta credenciales y JWT sin cambiar las mediciones', () => {
  const token = 'eyJheader000000000000.payload000000000000.signature000000000000'
  const text = JSON.stringify({ snippet: '<input value="private-value">', header: `Bearer ${token}`, bytes: 87589 })
  const clean = redact(text, ['private-value'])
  assert.ok(!clean.includes('private-value') && !clean.includes(token))
  assert.equal(JSON.parse(clean).bytes, 87589)
})
