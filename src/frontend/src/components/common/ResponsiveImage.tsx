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
  widths?: number[]
  sizes?: string
}

export function ResponsiveImage({ base, alt, width, height, priority = false, widths, sizes }: ResponsiveImageProps) {
  const srcSet = (extension: string) => widths
    ? widths.map(value => `${base}-${value}.${extension} ${value}w`).join(', ')
    : `${base}.${extension}`
  return <picture>
    <source srcSet={srcSet('avif')} sizes={sizes} type="image/avif" />
    <source srcSet={srcSet('webp')} sizes={sizes} type="image/webp" />
    <img src={widths ? `${base}-${widths[0]}.jpg` : `${base}.jpg`} srcSet={widths ? srcSet('jpg') : undefined} sizes={sizes} alt={alt} width={width} height={height}
      loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
  </picture>
}
