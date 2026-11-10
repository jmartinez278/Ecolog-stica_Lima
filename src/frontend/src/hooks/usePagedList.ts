import { useCallback, useEffect, useState } from 'react'
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
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PageResult<T>>({ items: [], total: 0, page: 1, limit: PAGE_SIZE, pages: 0 })
  useEffect(() => { setPage(1) }, [path])
  const load = useCallback(async () => {
    try {
      const body = toPage(await api<PageResult<T> | T[]>(pagedPath(path, page), token), page)
      if (body.pages > 0 && page > body.pages) { setPage(body.pages); return }
      setResult(body)
    } catch (error) { onError((error as Error).message) }
  }, [path, page, token])
  useEffect(() => { void load() }, [load])
  return { ...result, page, setPage, reload: load }
}
