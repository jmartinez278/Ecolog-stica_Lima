import { useEffect, useState, type FormEvent } from 'react'
import { api, orderListPath, type Order, type Client } from '../api'
import type { Notice } from '../types'
import { NoticeBox } from '../components/common/StatusMessage'
import { PageIntro } from '../components/common/PageIntro'
import { OrderFormView } from '../forms/OrderForm'
import { Field } from '../components/common/FormField'

type OrderForm = Omit<Order, 'pedido_id' | 'estado'>
const emptyOrder: OrderForm = {
  cliente_id: '', codigo_pedido: '', direccion_entrega: '', referencia_entrega: null,
  latitud: '', longitud: '', peso_kg: '', volumen_m3: '', ventana_inicio: '',
  ventana_fin: '', prioridad: 'MEDIA', tipo_producto: null,
}
function localDate(iso: string) {
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function OrdersPage({ token }: { token: string }) {
  const [items, setItems] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<OrderForm>(emptyOrder)
  const [editing, setEditing] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  async function load() {
    try { setItems(await api<Order[]>(orderListPath(filter), token)) }
    catch (error) { setNotice({ text: (error as Error).message, error: true }) }
  }
  useEffect(() => { void load() }, [token, filter])
  useEffect(() => {
    void api<Client[]>('/clientes?activo=true', token).then(setClients).catch(error => setNotice({ text: error.message, error: true }))
  }, [token])
  function set<K extends keyof OrderForm>(key: K, value: OrderForm[K]) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null)
    try {
      const payload = {
        ...form,
        ventana_inicio: new Date(form.ventana_inicio).toISOString(),
        ventana_fin: new Date(form.ventana_fin).toISOString(),
      }
      await api(editing ? `/pedidos/${editing}` : '/pedidos', token, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      setNotice({ text: editing ? 'Pedido actualizado.' : 'Pedido registrado.', error: false })
      setEditing(null); setForm(emptyOrder); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
    finally { setBusy(false) }
  }
  async function cancel(item: Order) {
    if (!window.confirm(`¿Cancelar el pedido ${item.codigo_pedido}?`)) return
    try {
      await api(`/pedidos/${item.pedido_id}/cancelar`, token, { method: 'PATCH' })
      setNotice({ text: 'Pedido cancelado.', error: false }); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
  }
  return <section><PageIntro number="02" title="Pedidos" description="Registra entregas, revisa su estado y actualiza las solicitudes pendientes." /><NoticeBox notice={notice} />
    <div className="split"><div className="panel"><p className="panel-label">ENTREGAS / FORMULARIO</p><h2>{editing ? 'Editar pedido' : 'Registrar pedido'}</h2><p className="panel-description">Define destino, carga y una ventana de tiempo válida.</p>
      <OrderFormView form={form} editing={editing} busy={busy} set={set} submit={submit} onCancel={() => { setEditing(null); setForm(emptyOrder) }} clients={clients} />{clients.length === 0 && <p>No hay clientes activos para registrar pedidos.</p>}
    </div><div className="panel"><p className="panel-label">ENTREGAS / REGISTROS</p><div className="panel-heading"><h2>Pedidos registrados</h2><span className="count-pill">{items.length}</span></div>
      <Field label="Filtrar por estado"><select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Todos</option>{['PENDIENTE', 'PLANIFICADO', 'EN_RUTA', 'ENTREGADO', 'CANCELADO', 'NO_ASIGNADO'].map(state => <option key={state}>{state}</option>)}
      </select></Field>
      {items.length === 0 ? <p className="empty-state">No hay pedidos para el filtro seleccionado.</p> : <ul className="cards">
        {items.map(item => <li key={item.pedido_id}><div className="card-heading"><strong>{item.codigo_pedido}</strong><span className="badge" data-state={item.estado}>{item.estado}</span></div>
          <p className="card-subtitle">{item.direccion_entrega}</p><p className="card-detail"><span>{item.peso_kg} kg</span><span>{item.volumen_m3} m³</span><span>Prioridad {item.prioridad}</span></p>
          {item.estado === 'PENDIENTE' && <div className="actions">
            <button className="secondary" type="button" onClick={() => {
              setEditing(item.pedido_id); setForm({ ...item, ventana_inicio: localDate(item.ventana_inicio), ventana_fin: localDate(item.ventana_fin) }); window.scrollTo(0, 0)
            }}>Editar</button>
            <button className="danger" type="button" onClick={() => void cancel(item)}>Cancelar pedido</button>
          </div>}
        </li>)}
      </ul>}
    </div></div></section>
}
