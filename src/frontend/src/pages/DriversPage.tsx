import { useState, type FormEvent } from 'react'
import { api, type Driver } from '../api'
import type { Notice } from '../types'
import { NoticeBox } from '../components/common/StatusMessage'
import { Pagination } from '../components/common/Pagination'
import { usePagedList } from '../hooks/usePagedList'
import { PageIntro } from '../components/common/PageIntro'
import { DriverFormView } from '../forms/DriverForm'

type DriverForm = Omit<Driver, 'conductor_id'>
const emptyDriver: DriverForm = {
  nombres: '', apellidos: '', numero_licencia: '', categoria_licencia: '',
  telefono: null, experiencia_anios: null, estado: 'DISPONIBLE',
}

export function DriversPage({ token }: { token: string }) {
  const [form, setForm] = useState<DriverForm>(emptyDriver)
  const [editing, setEditing] = useState<string | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  const list = usePagedList<Driver>(`/conductores${onlyAvailable ? '?disponible=true' : ''}`, token, text => setNotice({ text, error: true }))
  const { items, reload: load } = list
  function set<K extends keyof DriverForm>(key: K, value: DriverForm[K]) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null)
    try {
      await api(editing ? `/conductores/${editing}` : '/conductores', token, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      })
      setNotice({ text: editing ? 'Conductor actualizado.' : 'Conductor registrado.', error: false })
      setEditing(null); setForm(emptyDriver); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
    finally { setBusy(false) }
  }
  async function deactivate(item: Driver) {
    if (!window.confirm(`¿Desactivar al conductor ${item.nombres} ${item.apellidos}?`)) return
    try {
      await api(`/conductores/${item.conductor_id}/desactivar`, token, { method: 'PATCH' })
      setNotice({ text: 'Conductor desactivado.', error: false }); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
  }
  return <section><PageIntro number="03" title="Conductores" description="Registra, consulta y mantén actualizada la disponibilidad del equipo." /><NoticeBox notice={notice} />
    <div className="split"><div className="panel"><p className="panel-label">EQUIPO / FORMULARIO</p><h2>{editing ? 'Editar conductor' : 'Registrar conductor'}</h2><p className="panel-description">Mantén la información de licencia y disponibilidad en un solo lugar.</p><DriverFormView form={form} editing={editing} busy={busy} set={set} submit={submit} onCancel={() => { setEditing(null); setForm(emptyDriver) }} /></div><div className="panel"><p className="panel-label">EQUIPO / REGISTROS</p><div className="panel-heading"><h2>Conductores registrados</h2><span className="count-pill">{list.total}</span></div>
      <label className="check"><input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} /> Solo disponibles</label>
      {list.loading ? <p role="status">Cargando registros…</p> : items.length === 0 ? <p className="empty-state">{onlyAvailable ? 'No hay conductores disponibles.' : 'No existen conductores registrados.'}</p> : <ul className="cards">
        {items.map(item => <li key={item.conductor_id}><div className="card-heading"><strong>{item.nombres} {item.apellidos}</strong><span className="badge" data-state={item.estado}>{item.estado}</span></div><p className="card-subtitle">Licencia {item.numero_licencia} · {item.categoria_licencia}</p>
          <p className="card-detail"><span>{item.telefono || 'Sin teléfono'}</span><span>{item.experiencia_anios ?? 0} años de experiencia</span></p>
          {item.estado !== 'INACTIVO' && <div className="actions"><button type="button" className="secondary" onClick={() => { setEditing(item.conductor_id); setForm({ ...item }); window.scrollTo(0, 0) }}>Editar</button>
            {item.estado !== 'ASIGNADO' && <button type="button" className="danger" onClick={() => void deactivate(item)}>Desactivar</button>}
          </div>}
        </li>)}
      </ul>}
      <Pagination page={list.page} pages={list.pages} total={list.total} label="conductores" onChange={list.setPage} />
    </div></div></section>
}
