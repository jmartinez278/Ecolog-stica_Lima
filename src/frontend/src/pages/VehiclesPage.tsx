import { useState, type FormEvent } from 'react'
import { api, type Vehicle } from '../api'
import type { Notice } from '../types'
import { NoticeBox } from '../components/common/StatusMessage'
import { Pagination } from '../components/common/Pagination'
import { usePagedList } from '../hooks/usePagedList'
import { PageIntro } from '../components/common/PageIntro'
import { VehicleFormView } from '../forms/VehicleForm'

type VehicleForm = Omit<Vehicle, 'vehiculo_id'>
const emptyVehicle: VehicleForm = {
  placa: '', marca: '', modelo: '', capacidad_kg: '', capacidad_m3: '',
  consumo_km_l: null, factor_emision_kg_co2_km: null, estado: 'DISPONIBLE',
}

export function VehiclesPage({ token }: { token: string }) {
  const [form, setForm] = useState<VehicleForm>(emptyVehicle)
  const [editing, setEditing] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)

  const list = usePagedList<Vehicle>('/vehiculos', token, text => setNotice({ text, error: true }))
  const { items, reload: load } = list

  function set<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(null)
    try {
      await api(editing ? `/vehiculos/${editing}` : '/vehiculos', token, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      })
      setNotice({ text: editing ? 'Vehículo actualizado.' : 'Vehículo registrado.', error: false })
      setEditing(null); setForm(emptyVehicle); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
    finally { setBusy(false) }
  }

  async function deactivate(item: Vehicle) {
    if (!window.confirm(`¿Desactivar el vehículo ${item.placa}?`)) return
    try {
      await api(`/vehiculos/${item.vehiculo_id}/desactivar`, token, { method: 'PATCH' })
      setNotice({ text: 'Vehículo desactivado.', error: false }); await load()
    } catch (error) { setNotice({ text: (error as Error).message, error: true }) }
  }

  return <section>
    <PageIntro number="01" title="Vehículos" description="Organiza la flota y mantén sus datos operativos al día." /><NoticeBox notice={notice} />
    <div className="split"><div className="panel">
      <p className="panel-label">FLOTA / FORMULARIO</p><h2>{editing ? 'Editar vehículo' : 'Registrar vehículo'}</h2><p className="panel-description">Datos que identifican y describen la capacidad de cada unidad.</p>
      <VehicleFormView form={form} editing={editing} busy={busy} set={set} submit={submit} onCancel={() => { setEditing(null); setForm(emptyVehicle) }} />
    </div><div className="panel"><p className="panel-label">FLOTA / REGISTROS</p><div className="panel-heading"><h2>Flota registrada</h2><span className="count-pill">{list.total}</span></div>
      {items.length === 0 ? <p className="empty-state">No existen vehículos registrados.</p> : <ul className="cards">
        {items.map(item => <li key={item.vehiculo_id}><div className="card-heading"><strong>{item.placa}</strong><span className="badge" data-state={item.estado}>{item.estado}</span></div>
          <p className="card-subtitle">{item.marca} · {item.modelo}</p><p className="card-detail"><span>{item.capacidad_kg} kg</span><span>{item.capacidad_m3} m³</span></p>
          <div className="actions"><button type="button" className="secondary" onClick={() => { setEditing(item.vehiculo_id); setForm({ ...item }); window.scrollTo(0, 0) }}>Editar</button>
            {item.estado !== 'INACTIVO' && <button type="button" className="danger" onClick={() => void deactivate(item)}>Desactivar</button>}
          </div></li>)}
      </ul>}
      <Pagination page={list.page} pages={list.pages} total={list.total} label="vehículos" onChange={list.setPage} />
    </div></div>
  </section>
}
