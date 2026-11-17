[← Volver al README principal](../../../README.md)

# Evaluación cuantitativa de usabilidad (SUS)

| Campo | Detalle |
|---|---|
| Proyecto | EcoLogística Lima — versión desplegada en [ecologistica-lima.vercel.app](https://ecologistica-lima.vercel.app) |
| Líder del proyecto | Martinez Llanos, Marco Jhair |
| Jira | ECO-81 — Evaluar usabilidad mediante escala SUS |
| Instrumento | System Usability Scale (Brooke, 1996), versión en español de 10 ítems |
| Versión del documento | V_1_0_0 · 17/11/2026 |

## 1. Ficha técnica de la evaluación

| Elemento | Definición |
|---|---|
| Instrumento | SUS de 10 afirmaciones que alternan tono positivo (ítems impares) y negativo (ítems pares). Se eligió porque es el estándar de la industria, funciona con muestras pequeñas y permite comparar con el umbral de 68 puntos. |
| Escala | Likert de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo); todas las afirmaciones son obligatorias. |
| Población objetivo | Usuarios finales del MVP según el documento [08. Usuarios](<../../01 Inicio/08. Usuarios V_1_0_0.md>): operadores logísticos y supervisores de DistriRápido S.A.C., más stakeholders de gerencia y el docente evaluador. |
| Muestra | n ≥ 5 participantes, criterio de la rúbrica y mínimo habitual para estimar SUS. Se registra rol y experiencia previa con sistemas de gestión de cada uno. |
| Entorno | Producción (Vercel + Render) con una cuenta de operador de evaluación entregada por el equipo; navegador del propio participante. |
| Modalidad | Moderada: un integrante observa, no ayuda salvo que el participante lo pida, y anota si la tarea se completó sin ayuda, con ayuda o no se completó. |
| Recolección | [Formulario SUS de EcoLogística](https://claude.ai/artifact/NWxevHd5zKbeSdd35zTVT9). Cada participante guarda una sola respuesta, identificada por un código (P1, P2…); no se registran nombres. Quien no pueda guardar desde la página copia un código de respaldo que contiene las mismas respuestas. |
| Cálculo | [`scripts/sus_score.py`](../../../scripts/sus_score.py), cubierto por pruebas unitarias en [`scripts/test_sus_score.py`](../../../scripts/test_sus_score.py) y ejecutado en `tests.yml`. |

### 1.1 Tareas ejecutadas antes de responder

| Tarea | Descripción | Historias relacionadas |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de operador | Acceso |
| T2 | Registrar un vehículo (placa, marca, modelo y capacidades) | US-001 |
| T3 | Registrar un cliente con correo y preferencia de entrega | US-013 |
| T4 | Registrar un pedido para ese cliente con ventana de entrega | US-005 |
| T5 | Cambiar el estado de un vehículo y cancelar el pedido creado | US-003, US-008 |

Son los mismos recorridos que automatiza la suite Playwright, de modo que la medición subjetiva (SUS) y la técnica (E2E) evalúan los mismos flujos.

### 1.2 Cuestionario aplicado

| # | Afirmación | Tono |
|---|---|---|
| Q1 | Creo que me gustaría usar este sistema con frecuencia. | Positivo |
| Q2 | Encontré el sistema innecesariamente complejo. | Negativo |
| Q3 | Pensé que el sistema era fácil de usar. | Positivo |
| Q4 | Creo que necesitaría el apoyo de una persona técnica para poder usar este sistema. | Negativo |
| Q5 | Encontré que las distintas funciones del sistema estaban bien integradas. | Positivo |
| Q6 | Pensé que había demasiada inconsistencia en el sistema. | Negativo |
| Q7 | Imagino que la mayoría de las personas aprendería a usar este sistema muy rápidamente. | Positivo |
| Q8 | Encontré el sistema muy engorroso de usar. | Negativo |
| Q9 | Me sentí muy seguro/a usando el sistema. | Positivo |
| Q10 | Necesité aprender muchas cosas antes de poder empezar a usar el sistema. | Negativo |

## 2. Método de cálculo

Para cada participante:

1. Ítems impares (Q1, Q3, Q5, Q7, Q9): contribución = respuesta − 1.
2. Ítems pares (Q2, Q4, Q6, Q8, Q10): contribución = 5 − respuesta.
3. Suma de las 10 contribuciones (0 a 40) × 2,5 = puntaje SUS individual (0 a 100).

El puntaje global es el promedio aritmético de los puntajes individuales; se informan también desviación estándar, mínimo y máximo.

**Ejemplo verificado** (caso de prueba `test_brooke_reference_example`): respuestas 4, 2, 4, 1, 5, 2, 4, 1, 4, 2.

| Paso | Cálculo | Resultado |
|---|---|---|
| Impares | (4−1) + (4−1) + (5−1) + (4−1) + (4−1) | 16 |
| Pares | (5−2) + (5−1) + (5−2) + (5−1) + (5−2) | 17 |
| SUS | (16 + 17) × 2,5 | **82,5** |

**Interpretación** (curva de calificación de Sauro y Lewis): A ≥ 80,3 (excelente) · B ≥ 74 (bueno) · C ≥ 68 (aceptable, promedio de la industria) · D ≥ 51 (marginal) · F < 51 (inaceptable). El umbral de aceptación del proyecto es **68**.

## 3. Resultados cuantitativos

**Estado al 17/11/2026: recolección en curso, 0 respuestas registradas.** El formulario se publicó en esta fecha y la retrospectiva propone completar las sesiones con participantes hasta el 21/11/2026 (acción A2 de la [retrospectiva](<02 Retrospectiva del Sprint V_1_0_0.md>)). Este informe no presenta puntajes porque no se inventan respuestas: las tablas de esta sección se generan con `sus_score.py` a partir de las respuestas reales y se incorporarán en la versión V_1_1_0.

Las tablas que se publicarán, en este orden, son:

1. **Matriz de respuestas brutas:** participante, rol y Q1–Q10.
2. **Cálculo paso a paso por participante:** contribuciones impares, pares, suma y SUS.
3. **Resumen global:** n, promedio, desviación estándar, mínimo, máximo, grado A–F y comparación con 68.
4. **Éxito por tarea:** T1–T5 sin ayuda, con ayuda o no completadas.
5. **Promedio por ítem:** para ubicar qué afirmación baja el puntaje.

Comando para generarlas:

```bash
python3 scripts/sus_score.py respuestas.json codigos-respaldo.txt
```

## 4. Análisis e interpretación

### 4.1 Comparación con el estándar

Se comparará el promedio con el umbral de 68 y se le asignará grado y adjetivo según la tabla de la sección 2. Con n pequeña, un puntaje cercano a 68 se interpretará con cautela: se informará la desviación estándar y si la mayoría de los puntajes individuales está por encima o por debajo del umbral.

### 4.2 Posibles cuellos de botella a observar

Son hipótesis tomadas de las pruebas E2E y de la revisión de la interfaz. Las respuestas y los registros de tareas las confirmarán o descartarán; ninguna se presenta como resultado.

| Punto de la interfaz | Por qué podría afectar la usabilidad | Ítems y tarea que lo reflejarían |
|---|---|---|
| Registro de pedidos: 12 campos, incluidas latitud y longitud manuales | Un operador no suele conocer las coordenadas de memoria | Q2, Q8, T4 |
| Selector de clientes paginado de 12 en 12 dentro del formulario de pedido | El cliente recién creado puede no estar en la primera página (las pruebas E2E tuvieron que avanzar páginas para encontrarlo) | Q5, Q8, T4 |
| Listados ordenados del más antiguo al más reciente | El registro recién creado aparece en la última página | Q3, Q6, T2 y T5 |
| Confirmaciones de desactivación y cancelación con diálogo del navegador | El estilo no coincide con el resto de la interfaz | Q6 |
| Primer acceso tras inactividad de la API (arranque en frío de 37,6 s) | El participante puede pensar que el sistema falló | Q9, T1 |

### 4.3 Mejoras aplicadas en este Sprint

| Mejora | Problema que resuelve | Verificación |
|---|---|---|
| Mensajes de error comprensibles e iguales en todos los navegadores (`api.ts`, versión 1.5.0) | En 1.4.0 el usuario veía `Failed to fetch`, `Load failed` o solo `Error 503` | Pruebas 18 y 19 de [03 Análisis Playwright](<03 Analisis PlayWrigth V_1_0_0.md>) en tres navegadores; ocho pruebas unitarias |
| Botón “Ingresando…” deshabilitado mientras responde la API | Evita envíos duplicados cuando la API tarda | Prueba 20 (respuesta lenta de 1,5 s) |

### 4.4 Mejoras propuestas, sujetas a los resultados

| Propuesta | Cuello de botella relacionado |
|---|---|
| Ordenar los listados del más reciente al más antiguo o resaltar el registro recién creado | Listados y selector de clientes |
| Buscador por nombre en el selector de clientes | Selector paginado |
| Obtener coordenadas desde la dirección con geocodificación (US del backlog de mapas) | Latitud y longitud manuales |
| Confirmaciones dentro de la propia interfaz | Diálogos del navegador |
| Indicador “Conectando con el servidor…” durante el arranque en frío | Primer acceso |

Las propuestas se priorizarán según el promedio por ítem y las tareas con menor éxito sin ayuda, y se registrarán en el backlog con su resultado SUS asociado.

[← Volver al README principal](../../../README.md)
