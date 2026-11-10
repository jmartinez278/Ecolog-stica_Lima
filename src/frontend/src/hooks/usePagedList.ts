import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'

// Green IT (Inspección 04): los listados piden bloques de 12 registros en lugar de la colección completa.
export const PAGE_SIZE = 12

export type PageResult<T> = { items: T[]; total: number; page: number; limit: number; pages: number }

export function pagedPath(path: string, page: number, limit = PAGE_SIZE): string {
  return `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`
}

/** Normaliza la respuesta: la API paginada devuelve un sobre; la anterior, una lista. */
export function toPage<T>(body: PageResult<T> | T[], page: number): PageResult<T> {
  if (Array.isArray(body)) return { items: body, total: body.length, page, limit: body.length, pages: body.length ? 1 : 0 }
  return body
}

export function usePagedList<T>(path: string, token: string, onError: (message: string) => void) {
  const scope = `${token}\0${path}`
  const [position, setPosition] = useState({ scope, page: 1 })
  const page = position.scope === scope ? position.page : 1
  const [revision, setRevision] = useState(0)
  const errorHandler = useRef(onError)
  errorHandler.current = onError
  const [response, setResponse] = useState<{ scope: string; page: number; body: PageResult<T> } | null>(null)
  const [pending, setPending] = useState(false)
  const setPage = useCallback((value: number) => setPosition({ scope, page: Math.max(1, value) }), [scope])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setPending(true)
    void api<PageResult<T> | T[]>(pagedPath(path, page), token, { signal: controller.signal })
      .then(data => {
        if (!active) return
        const body = toPage(data, page)
        const last = Math.max(1, body.pages)
        if (page > last) { setPage(last); return }
        setResponse({ scope, page, body })
      })
      .catch(error => { if (active) errorHandler.current((error as Error).message) })
      .finally(() => { if (active) setPending(false) })
    return () => { active = false; controller.abort() }
  }, [path, token, scope, page, revision, setPage])
  const result = response?.scope === scope && response.page === page
    ? response.body : { items: [], total: 0, page, limit: PAGE_SIZE, pages: 0 }
  return { ...result, page, setPage, reload, loading: pending }
}
