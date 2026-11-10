export type Vehicle = {
  vehiculo_id: string
  placa: string
  marca: string
  modelo: string
  capacidad_kg: string
  capacidad_m3: string
  consumo_km_l: string | null
  factor_emision_kg_co2_km: string | null
  estado: string
}

export type Driver = {
  conductor_id: string
  nombres: string
  apellidos: string
  numero_licencia: string
  categoria_licencia: string
  telefono: string | null
  experiencia_anios: number | null
  estado: string
}

export type Order = {
  pedido_id: string
  cliente_id: string
  codigo_pedido: string
  direccion_entrega: string
  referencia_entrega: string | null
  latitud: string
  longitud: string
  peso_kg: string
  volumen_m3: string
  ventana_inicio: string
  ventana_fin: string
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  tipo_producto: string | null
  estado: string
}

export type Client = {
  cliente_id: string
  nombre: string
  telefono: string | null
  email: string | null
  preferencia_entrega: string | null
  restriccion_acceso: string | null
  estado: 'ACTIVO' | 'INACTIVO'
  creado_en: string
}

export function orderListPath(state: string): string {
  switch (state) {
    case '': return '/pedidos'
    case 'PENDIENTE': return '/pedidos?estado=PENDIENTE'
    case 'PLANIFICADO': return '/pedidos?estado=PLANIFICADO'
    case 'EN_RUTA': return '/pedidos?estado=EN_RUTA'
    case 'ENTREGADO': return '/pedidos?estado=ENTREGADO'
    case 'CANCELADO': return '/pedidos?estado=CANCELADO'
    case 'NO_ASIGNADO': return '/pedidos?estado=NO_ASIGNADO'
    default: throw new Error('Estado de pedido inválido')
  }
}

export async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.at(-1) || 'Dato'}: ${item.msg || 'inválido'}`).join('; ')
        : `Error ${response.status}`
    throw new Error(message)
  }
  return body as T
}
