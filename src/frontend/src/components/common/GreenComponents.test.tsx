import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ClientPicker } from './ClientPicker'
import { ResponsiveImage } from './ResponsiveImage'
import { PageErrorBoundary } from './PageErrorBoundary'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
it('entrega variantes adaptativas y dimensiones estables sin diferir la imagen prioritaria', () => {
  const { container } = render(<ResponsiveImage base="/brand/logo" widths={[52, 104]} sizes="52px" alt="Marca" width={52} height={52} priority />)
  expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute('srcset', '/brand/logo-52.avif 52w, /brand/logo-104.avif 104w')
  expect(screen.getByAltText('Marca')).toHaveAttribute('loading', 'eager')
  expect(screen.getByAltText('Marca')).toHaveAttribute('width', '52')
})
it('muestra un control de recuperación cuando falla un módulo', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  function Broken(): never { throw new Error('Chunk no disponible') }
  render(<PageErrorBoundary><Broken /></PageErrorBoundary>)
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar')
  expect(screen.getByRole('button', { name: 'Recargar aplicación' })).toBeInTheDocument()
})
it('pagina las opciones de cliente y conserva el seleccionado fuera de página', async () => {
  const change = vi.fn()
  const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => url.includes('/clientes/retained')
    ? { cliente_id: 'retained', nombre: 'Cliente del pedido' }
    : { items: [{ cliente_id: url.includes('page=2') ? 'c2' : 'c1', nombre: url.includes('page=2') ? 'Segundo' : 'Primero' }], total: 13, page: url.includes('page=2') ? 2 : 1, limit: 12, pages: 2 } }))
  vi.stubGlobal('fetch', fetchMock)
  render(<ClientPicker value="retained" token="token" onChange={change} onError={vi.fn()} />)
  expect(await screen.findByRole('option', { name: 'Cliente del pedido' })).toBeInTheDocument()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Paginación de clientes disponibles' })).getByRole('button', { name: 'Siguiente' }))
  expect(await screen.findByRole('option', { name: 'Segundo' })).toBeInTheDocument()
  expect(screen.getByLabelText('Cliente')).toHaveValue('retained')
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'c2' } })
  expect(change).toHaveBeenCalledWith('c2')
  await waitFor(() => expect(fetchMock.mock.calls.every(([url]) => url.includes('page=') || url.endsWith('/retained'))).toBe(true))
})
