import { afterEach, expect, it, vi } from 'vitest'
import { api, NETWORK_ERROR_MESSAGE, orderListPath, UNAVAILABLE_MESSAGE } from './api'

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

it.each([new TypeError('Failed to fetch'), new TypeError('Load failed'), new TypeError('NetworkError when attempting to fetch resource.')])(
  'unifica el fallo de red del navegador (%s)', async error => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error))
    await expect(api('/vehiculos', 'test-token')).rejects.toThrow(NETWORK_ERROR_MESSAGE)
  },
)

it('propaga la cancelación intencional sin convertirla en error de red', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
  await expect(api('/vehiculos', 'test-token')).rejects.toMatchObject({ name: 'AbortError' })
})

it.each([502, 503, 504])('explica la indisponibilidad temporal del servicio (%i)', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>gateway</html>', { status })))
  await expect(api('/vehiculos', 'test-token')).rejects.toThrow(`${UNAVAILABLE_MESSAGE} (Error ${status})`)
})

it('conserva el detalle de negocio devuelto por la API', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Credenciales inválidas' }), { status: 401 })))
  await expect(api('/auth/login', '')).rejects.toThrow('Credenciales inválidas')
})
