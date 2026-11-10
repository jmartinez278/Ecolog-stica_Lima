import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, pagedPath, toPage } from './usePagedList'

describe('paginación Green IT', () => {
  it('solicita bloques de 12 registros respetando filtros existentes', () => {
    expect(PAGE_SIZE).toBe(12)
    expect(pagedPath('/pedidos', 1)).toBe('/pedidos?page=1&limit=12')
    expect(pagedPath('/pedidos?estado=PENDIENTE', 3)).toBe('/pedidos?estado=PENDIENTE&page=3&limit=12')
  })

  it('acepta el sobre paginado y la lista anterior', () => {
    const envelope = { items: [1, 2], total: 14, page: 2, limit: 12, pages: 2 }
    expect(toPage(envelope, 2)).toBe(envelope)
    expect(toPage([1, 2, 3], 1)).toEqual({ items: [1, 2, 3], total: 3, page: 1, limit: 3, pages: 1 })
    expect(toPage([], 1).pages).toBe(0)
  })
})
