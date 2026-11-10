import { test } from 'node:test'
import assert from 'node:assert/strict'
import { median, mean } from './math.mjs'
test('mediana exacta para muestras pares, impares y vacías', () => {
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([4, 1, 3, 2]), 2.5)
  assert.equal(median([.4, .1]), .25)
  assert.throws(() => median([]), /No hay muestras/)
  assert.equal(mean([1, 2, 3, 10]), 4)
  assert.throws(() => mean([]), /No hay muestras/)
})
