export function median(values) {
  if (!values.length) throw new Error('No hay muestras para calcular la mediana')
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function mean(values) {
  if (!values.length) throw new Error('No hay muestras para calcular la media')
  return values.reduce((total, value) => total + value, 0) / values.length
}
