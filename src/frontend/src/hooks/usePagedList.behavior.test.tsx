import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NETWORK_ERROR_MESSAGE } from '../api'
import { usePagedList } from './usePagedList'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const response = (items: string[], page = 1, pages = 2) => ({ ok: true, json: async () => ({ items, total: 13, page, limit: 12, pages }) }) as Response

it('descarta una respuesta anterior y reinicia la página al cambiar el filtro', async () => {
  let resolveOld!: (value: Response) => void
  const fetchMock = vi.fn((url: string) => url.includes('estado=')
    ? Promise.resolve(response(['filtrado'])) : new Promise<Response>(resolve => { resolveOld = resolve }))
  vi.stubGlobal('fetch', fetchMock)
  const { result, rerender } = renderHook(({ path }) => usePagedList<string>(path, 'token', vi.fn()), { initialProps: { path: '/pedidos' } })
  await act(async () => { result.current.setPage(2) })
  rerender({ path: '/pedidos?estado=PENDIENTE' })
  await waitFor(() => expect(result.current.items).toEqual(['filtrado']))
  await act(async () => resolveOld(response(['obsoleto'], 2)))
  expect(result.current.items).toEqual(['filtrado'])
  expect(result.current.page).toBe(1)
  expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/pedidos?estado=PENDIENTE&page=1&limit=12', expect.anything())
})

it('vuelve a una página válida cuando desaparece el último registro', async () => {
  const fetchMock = vi.fn(async (url: string) => response(url.includes('page=2') ? [] : ['restante'], url.includes('page=2') ? 2 : 1, 1))
  vi.stubGlobal('fetch', fetchMock)
  const { result } = renderHook(() => usePagedList<string>('/pedidos', 'token', vi.fn()))
  await waitFor(() => expect(result.current.items).toEqual(['restante']))
  act(() => result.current.setPage(2))
  await waitFor(() => expect(result.current.page).toBe(1))
  await waitFor(() => expect(result.current.items).toEqual(['restante']))
})

it('notifica errores y permite recargar sin bucles de peticiones', async () => {
  const error = vi.fn()
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(response([]))
  vi.stubGlobal('fetch', fetchMock)
  const { result } = renderHook(() => usePagedList<string>('/clientes', 'token', error))
  await waitFor(() => expect(error).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE))
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('indica carga desde el primer render y la termina si la petición falla', async () => {
  let reject: (error: Error) => void = () => {}
  vi.stubGlobal('fetch', vi.fn(() => new Promise((_, fail) => { reject = fail })))
  const error = vi.fn()
  const { result } = renderHook(() => usePagedList<string>('/clientes', 'token', error))
  // Antes de que llegue cualquier respuesta no debe mostrarse un estado vacío definitivo.
  expect(result.current.loading).toBe(true)
  expect(result.current.items).toEqual([])
  await act(async () => { reject(new TypeError('Failed to fetch')) })
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(error).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE)
})
