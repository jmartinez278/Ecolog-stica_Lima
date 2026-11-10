import { afterEach, expect, it, vi } from 'vitest'
import { api, orderListPath } from './api'

afterEach(() => vi.unstubAllGlobals())

it.each(['', 'PENDIENTE', 'PLANIFICADO', 'EN_RUTA', 'ENTREGADO', 'CANCELADO', 'NO_ASIGNADO'])(
  'conserva la ruta del filtro permitido %s', state => {
    expect(orderListPath(state)).toBe(state ? `/pedidos?estado=${state}` : '/pedidos')
  },
)

it.each(['PENDIENTE&otro=1', '../auth/login', '//example.invalid', 'PENDIENTE#fragment', 'pendiente'])(
  'rechaza el filtro manipulado %s antes de enviar una petición', async state => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(async () => api(orderListPath(state), 'test-token')).rejects.toThrow('Estado de pedido inválido')
    expect(fetchMock).not.toHaveBeenCalled()
  },
)
