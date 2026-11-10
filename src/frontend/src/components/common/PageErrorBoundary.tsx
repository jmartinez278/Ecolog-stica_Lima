import { Component, type ReactNode } from 'react'

export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div role="alert">
      <p>No se pudo cargar esta pantalla. Recarga para volver a intentarlo.</p>
      <button type="button" onClick={() => window.location.reload()}>Recargar aplicación</button>
    </div>
    return this.props.children
  }
}
