import { useEffect, useState } from 'react'
import { api, type Client } from '../../api'
import { usePagedList } from '../../hooks/usePagedList'
import { Field } from './FormField'
import { Pagination } from './Pagination'

/** Opciones acotadas; el cliente de un pedido existente sigue visible fuera de página. */
export function ClientPicker({ value, token, onChange, onError }: {
  value: string; token: string; onChange: (id: string) => void; onError: (message: string) => void
}) {
  const list = usePagedList<Client>('/clientes?activo=true', token, onError)
  const [selected, setSelected] = useState<Client | null>(null)
  const visible = list.items.find(client => client.cliente_id === value)
  useEffect(() => {
    if (!value || visible || selected?.cliente_id === value) return
    const controller = new AbortController()
    void api<Client>(`/clientes/${encodeURIComponent(value)}`, token, { signal: controller.signal })
      .then(client => { if (!controller.signal.aborted) setSelected(client) })
      .catch(error => { if (!controller.signal.aborted) onError((error as Error).message) })
    return () => controller.abort()
  }, [value, visible, selected, token, onError])
  const retained = selected?.cliente_id === value && !visible ? selected : null
  return <div className="client-picker">
    <Field label="Cliente"><select required value={value} aria-busy={list.loading} onChange={event => {
      setSelected(list.items.find(client => client.cliente_id === event.target.value) ?? null)
      onChange(event.target.value)
    }}>
      <option value="">Selecciona un cliente</option>
      {value && !visible && !retained && <option value={value}>Cliente seleccionado ({value})</option>}
      {retained && <option value={value}>{retained.nombre}</option>}
      {list.items.map(client => <option key={client.cliente_id} value={client.cliente_id}>{client.nombre}</option>)}
    </select></Field>
    {list.loading && <p role="status">Cargando clientes…</p>}
    {!list.loading && list.total === 0 && <p>No hay clientes activos para registrar pedidos.</p>}
    <Pagination page={list.page} pages={list.pages} total={list.total} label="clientes disponibles" onChange={list.setPage} />
  </div>
}
