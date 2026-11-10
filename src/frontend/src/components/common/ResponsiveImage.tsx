// Green IT (Inspección 04): única vía permitida para mostrar imágenes ráster.
// Sirve AVIF/WebP según soporte del navegador, reserva el espacio (sin CLS) y difiere
// la descarga de imágenes fuera de la vista inicial.
export type ResponsiveImageProps = {
  /** Ruta base sin extensión; deben existir `${base}.avif`, `${base}.webp` y `${base}.jpg`. */
  base: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export function ResponsiveImage({ base, alt, width, height, priority = false }: ResponsiveImageProps) {
  return <picture>
    <source srcSet={`${base}.avif`} type="image/avif" />
    <source srcSet={`${base}.webp`} type="image/webp" />
    <img src={`${base}.jpg`} alt={alt} width={width} height={height}
      loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
  </picture>
}
