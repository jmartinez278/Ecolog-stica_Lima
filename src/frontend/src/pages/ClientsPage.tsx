import { useState, type FormEvent } from 'react'
import { api, type Client } from '../api'
import type { Notice } from '../types'
import { NoticeBox } from '../components/common/StatusMessage'
import { Pagination } from '../components/common/Pagination'
import { usePagedList } from '../hooks/usePagedList'
import { PageIntro } from '../components/common/PageIntro'
import { ClientFormView } from '../forms/ClientForm'

type ClientForm = Omit<Client, 'cliente_id' | 'creado_en'>
const emptyClient: ClientForm = {
  nombre: '', telefono: null, email: null, preferencia_entrega: null,
  restriccion_acceso: null, estado: 'ACTIVO',
}

export function ClientsPage({ token }: { token: string }) {
  const [form, setForm] = useState<ClientForm>(emptyClient)
  const [editing, setEditing] = useState<string | null>(null)
  const [onlyActive, setOnlyActive] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  const list = usePagedList<Client>(`/clientes${onlyActive ? '?activo=true' : ''}`, token, text => setNotice({ text, error: true }))
  const { items, reload: load } = list
  function set<K extends keyof ClientForm>(key: K, value: ClientForm[K]) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null)
    try {
      await api(editing ? `/clientes/${editing}` : '/clientes', token, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      })
      setNotice({ text: editing ? 'Cliente actualizado.' : 'Cliente registrado.', error: false })
      setEditing(null); setForm(emptyClient); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
    finally { setBusy(false) }
  }
  return <section><PageIntro number="04" title="Clientes" description="Administra los datos y las condiciones de entrega de cada cliente." /><NoticeBox notice={notice} />
    <div className="split"><div className="panel"><p className="panel-label">CLIENTES / FORMULARIO</p><h2>{editing ? 'Editar cliente' : 'Registrar cliente'}</h2>
      <p className="panel-description">Registra información de contacto, preferencias y restricciones de acceso.</p><ClientFormView form={form} editing={editing} busy={busy} set={set} submit={submit} onCancel={() => { setEditing(null); setForm(emptyClient) }} />
    </div><div className="panel"><p className="panel-label">CLIENTES / REGISTROS</p><div className="panel-heading"><h2>Clientes registrados</h2><span className="count-pill">{list.total}</span></div>
      <label className="check"><input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} /> Solo activos</label>
      {list.loading ? <p role="status">Cargando registros…</p> : items.length === 0 ? <p className="empty-state">{onlyActive ? 'No hay clientes activos.' : 'No existen clientes registrados.'}</p> : <ul className="cards">
        {items.map(item => <li key={item.cliente_id}><div className="card-heading"><strong>{item.nombre}</strong><span className="badge" data-state={item.estado}>{item.estado}</span></div>
          <p className="card-subtitle">{item.email || 'Sin correo'} · {item.telefono || 'Sin teléfono'}</p><p className="card-detail"><span>Preferencia: {item.preferencia_entrega || 'Sin especificar'}</span><span>Acceso: {item.restriccion_acceso || 'Sin restricciones'}</span></p>
          <div className="actions"><button type="button" className="secondary" onClick={() => { setEditing(item.cliente_id); setForm({ nombre: item.nombre, telefono: item.telefono, email: item.email, preferencia_entrega: item.preferencia_entrega, restriccion_acceso: item.restriccion_acceso, estado: item.estado }); window.scrollTo(0, 0) }}>Editar</button></div>
        </li>)}
      </ul>}
      <Pagination page={list.page} pages={list.pages} total={list.total} label="clientes" onChange={list.setPage} />
    </div></div>
  </section>
}
