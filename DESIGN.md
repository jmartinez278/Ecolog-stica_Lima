# Diseño de interfaz — EcoLogística Lima

Esta guía describe la interfaz conservada hasta el Sprint 4. La fuente ejecutable es `src/frontend/src/style.css` y los módulos de `src/frontend/src/styles/`; si cambian los estilos, actualizar esta guía en el mismo trabajo.

## Dirección visual

La interfaz toma como referencia general la estética de [mouredev pro](https://mouredev.pro/): fondo oscuro con cuadrícula, títulos de gran tamaño, acentos vivos y paneles que recuerdan a ventanas de software. La composición, el monograma `EL`, los textos y los elementos gráficos de EcoLogística Lima son propios; no se usan logotipos, imágenes ni otros recursos de la referencia.

El resultado debe sentirse como una herramienta de operación logística: el contenido y las acciones tienen prioridad sobre la decoración. El diseño cubre acceso, Inicio, Vehículos, Pedidos, Conductores y Clientes.

## Colores

| Uso | Valor | Aplicación actual |
|---|---|---|
| Fondo general | `#101315` | Página completa |
| Cuadrícula | `#ffffff0a` | Líneas de 1 px cada 42 px sobre el fondo |
| Texto principal | `#f4f7f5` | Títulos y contenido principal |
| Texto secundario | `#aebbb9` | Descripciones y ayudas |
| Superficie | `#191e20` | Paneles y tarjetas |
| Superficie elevada | `#202729` | Token disponible para capas elevadas |
| Borde general | `#3b4648` | Delimitación de paneles |
| Verde principal | `#28df83` | Acciones primarias, marca, etiquetas y foco de formularios |
| Azul de acento | `#55baff` | Títulos destacados, flechas y contorno de foco de teclado |
| Campo de formulario | `#111719` | Fondo de `input` y `select` |

Los colores principales están declarados como variables CSS (`--surface`, `--surface-raised`, `--line`, `--muted`, `--green` y `--blue`) en `:root`. Cuando se incorpore un componente nuevo, reutilizar estos tokens antes de agregar un color.

### Estados y mensajes

- Acción principal: fondo verde `#28df83` y texto oscuro `#082315`.
- Acción secundaria: fondo `#2b3535`, borde `#637473` y texto claro.
- Acción de riesgo: fondo `#3d2225`, borde `#b2686b` y texto `#ffd8d8`.
- Estado disponible o pendiente: insignia verde oscura `#1e3d2b`, texto `#b6f8cc`.
- Estado inactivo, cancelado o descanso: insignia cálida `#3a2b2a`, texto `#ffd6b7`.
- Estado mantenimiento, planificado o asignado: insignia azul oscura `#273a4b`, texto `#c6e8ff`.
- Mensaje de éxito: fondo `#1d2d25` y borde izquierdo verde. Mensaje de error: fondo `#382427`, borde `#ff7b80` y texto `#ffd9d9`.

El estado siempre aparece también en texto; el color no debe ser el único indicador.

## Tipografía y jerarquía

- Texto general: `Inter`, seguido de fuentes de sistema. El proyecto no descarga ni empaqueta Inter; se usa una alternativa instalada cuando no está disponible.
- Etiquetas técnicas, números de módulo y edición: familia monoespaciada de sistema, mayúsculas y espaciado entre letras de `0.14em`.
- Títulos de página: peso `900`, espaciado `-0.075em` y tamaño adaptable mediante `clamp(3.25rem, 6.4vw, 6rem)` en escritorio. En móvil se reduce para evitar desbordamiento de títulos largos.
- Títulos de panel: aproximadamente `1.4rem–1.8rem`; datos clave de tarjetas: `1.13rem`.
- Texto de párrafo: interlineado `1.55`. El punto verde final de algunos títulos es decorativo y lleva `aria-hidden="true"`.

## Componentes y composición

- **Cabecera:** marca `EL`, nombre del producto, navegación Inicio/Vehículos/Pedidos/Conductores y salida. La sección activa tiene fondo verde oscuro y `aria-current="page"`.
- **Acceso:** composición de dos columnas en escritorio con titular, ventana ilustrativa propia y formulario. En móvil se oculta la ventana ilustrativa para dar prioridad al formulario.
- **Inicio:** bloque principal azul y verde, seguido por tres tarjetas que llevan a los módulos del Sprint 1. No representa métricas operativas.
- **Pantallas de módulo:** introducción con número de módulo, panel de formulario y panel de registros. En escritorio se muestran dos columnas; en pantallas estrechas se apilan.
- **Paneles y tarjetas:** superficies oscuras, bordes visibles, esquinas discretas y sombra desplazada de 8–11 px. Se evita depender de imágenes externas.
- **Formularios:** etiquetas siempre visibles, campos de al menos 44 px de alto, controles de dos columnas cuando caben y una columna en móvil. Los errores y confirmaciones aparecen cerca de la sección afectada.
- **Listas:** cada registro muestra identificador, estado textual, datos principales y acciones permitidas. Las insignias reciben el estado mediante `data-state`.
- **Estados vacíos:** mensaje explícito en una caja con borde discontinuo.

## Adaptación y accesibilidad

| Ancho | Comportamiento |
|---|---|
| Hasta 1050 px | La navegación pasa a una fila propia y se reduce la ilustración de Inicio. |
| Hasta 850 px | Los paneles operativos se apilan; acceso en una columna; tarjetas de Inicio en dos columnas. |
| Hasta 600 px | Navegación en cuadrícula 2 × 2; formularios y tarjetas en una columna. |
| Hasta 380 px | Ajustes de marca, etiquetas y tarjetas para evitar desbordamiento. |

Las funciones críticas deben seguir operables desde **360 px**, conforme a RNF-009 y EN-006. El frontend utiliza contorno de foco visible de 3 px, etiquetas asociadas a los controles, `role="alert"` para errores, `role="status"` para confirmaciones y respeta `prefers-reduced-motion`. Estos mecanismos son una base de accesibilidad; **no sustituyen** una evaluación completa de WCAG 2.1 AA ni pruebas en los navegadores documentados.

## Mantenimiento

Antes de dar por terminado un cambio visual, ejecutar `npm test` y `npm run build` desde `src/frontend`, revisar las cuatro pantallas a 360 px y en escritorio, comprobar foco de teclado y confirmar que no haya desplazamiento horizontal ni pérdida de las acciones de US-001 a US-010. Mantener esta guía sincronizada con `style.css` y `src/frontend/src/App.tsx`.


## Organización de la interfaz — versión del proyecto 1.2.4

El diseño anterior conserva su identidad visual. Para facilitar mantenimiento, `src/frontend/src/App.tsx` compone las pantallas, mientras `pages/` contiene login, inicio y los cuatro módulos; `forms/` separa los formularios, `components/common/` sus elementos reutilizables y `components/layout/` la navegación. Los estilos se organizan por propósito en `styles/` e ingresan por `style.css`. Las pruebas de componente y el build verifican que los flujos existentes sigan funcionando. Una revisión manual de accesibilidad y viewport de 360 px sigue siendo un control distinto.


## Controles y recursos del Sprint 4

- Los cuatro módulos y el selector de clientes muestran páginas de 12 registros, con controles Anterior/Siguiente y estado accesible. Los filtros reinician la página; las respuestas obsoletas se descartan.
- Las pantallas cargadas bajo demanda muestran un estado de carga y recuperación si un módulo falla. El acceso público se prerenderiza y se hidrata con los mismos controles.
- La marca del acceso usa `ResponsiveImage`, con dimensiones 52×52 y variantes 52/104 px AVIF/WebP/JPG. El SVG fuente y sus alternativas están en `src/frontend/public/brand/`; el fondo del recurso es `#9df8bf` y sus trazos `#0c1510`, coherentes con los tonos de marca del favicon.
- Conservar dimensiones, texto alternativo apropiado y prioridad: la marca visible inicialmente es eager; recursos fuera de pantalla usan lazy. El build valida alternativas y peso máximo.
- La comprobación real en 360 y 1440 px se conserva en la evidencia de Sprint 4; no añadir imágenes decorativas pesadas para simular un ahorro ambiental.
