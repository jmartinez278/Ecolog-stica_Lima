import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { Notice } from '../types'
import { Field } from '../components/common/FormField'
import { NoticeBox } from '../components/common/StatusMessage'

export function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      const result = await api<{ access_token: string }>('/auth/login', '', {
        method: 'POST', body: JSON.stringify({ email, password }),
      })
      onLogin(result.access_token)
    } catch (error) {
      setNotice({ text: (error as Error).message, error: true })
    } finally {
      setBusy(false)
    }
  }

  return <><a className="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" aria-label="Acceso" tabIndex={-1} className="login-shell"><div className="login-layout">
    <section className="login-story" aria-labelledby="login-title">
      <p className="eyebrow"><span className="eyebrow-mark" /> ECOLOGÍSTICA / LIMA</p>
      <h1 id="login-title">La operación,<br /><span>en orden.</span></h1>
      <p className="login-lead">Vehículos, pedidos y conductores en un mismo lugar. Una base clara para cada entrega.</p>
      <div className="preview-window" aria-hidden="true">
        <div className="window-bar"><span className="window-controls"><i /><i /><i /></span><span>OPERACIÓN / 1.4.0</span><span>● ACTIVO</span></div>
        <div className="preview-body"><span className="preview-kicker">PANEL OPERATIVO</span><strong>Todo listo para avanzar<span className="heading-dot">.</span></strong>
          <div className="preview-row"><span className="preview-icon">01</span><span>Vehículos</span><span>↗</span></div>
          <div className="preview-row"><span className="preview-icon">02</span><span>Pedidos</span><span>↗</span></div>
          <div className="preview-row"><span className="preview-icon">03</span><span>Conductores</span><span>↗</span></div>
          <div className="preview-row"><span className="preview-icon">04</span><span>Clientes</span><span>↗</span></div>
        </div>
      </div>
    </section>
    <section className="panel login-panel">
      <div className="panel-topline"><span>ACCESO / OPERADOR</span><span className="online-indicator">● SISTEMA LOCAL</span></div>
      <div className="login-panel-body"><span className="login-emblem" aria-hidden="true">EL<span>↗</span></span>
        <h2>Bienvenido de nuevo<span className="heading-dot">.</span></h2><p>Ingresa con tu cuenta de operador para continuar.</p>
        <form onSubmit={submit} className="form-grid">
          <Field label="Correo electrónico"><input type="email" autoComplete="username" required placeholder="operador@empresa.com" value={email} onChange={event => setEmail(event.target.value)} /></Field>
          <Field label="Contraseña"><input type="password" autoComplete="current-password" required placeholder="Tu contraseña" value={password} onChange={event => setPassword(event.target.value)} /></Field>
          <button className="login-submit" disabled={busy} type="submit">{busy ? 'Ingresando…' : 'Ingresar'}<span aria-hidden="true">→</span></button>
        </form><NoticeBox notice={notice} />
      </div>
      <div className="login-footer">GESTIÓN LOGÍSTICA / LIMA, PERÚ</div>
    </section>
  </div></main></>
}
