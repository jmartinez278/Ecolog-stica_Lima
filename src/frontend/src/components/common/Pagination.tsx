export function Pagination({ page, pages, total, label, onChange }: { page: number; pages: number; total: number; label: string; onChange: (page: number) => void }) {
  if (pages <= 1) return null
  return <nav className="pagination" aria-label={`Paginación de ${label}`}>
    <button type="button" className="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
    <span aria-live="polite">Página {page} de {pages} · {total} registros</span>
    <button type="button" className="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Siguiente</button>
  </nav>
}
