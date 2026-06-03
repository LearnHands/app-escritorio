# Registro de cambios — LearnHands

## [2.3.0] — 2026-06-03

### 🆕 Nuevo módulo — English
- Juego de oraciones en inglés con burbujas de palabras que caen
- **Nivel 1 (Básico):** 1 hueco — verbos simples y adjetivos
- **Nivel 2 (Intermedio):** 1 hueco — tiempos pasados y oraciones largas
- **Nivel 3 (Avanzado):** 2 huecos por oración — voz pasiva, perfecto continuo y condicionales
- Mecánica de snap gestual: acercar la burbuja al hueco correcto la engancha automáticamente sin necesidad de soltar
- Al completar: reproduce la oración en voz alta (Web Speech API, `en-US`) y muestra la traducción al español
- Botones de subir/bajar nivel con HandButton (dwell + pinza)
- Puntos escalables: 60 / 100 / 300 pts según nivel y número de huecos

### 🔬 Laboratorio de Química — mejoras mayores
- **Dos secciones visuales** en la paleta: *Elementos base* (16 elementos de la tabla periódica: H, O, N, C, S, Na, Cl, Fe, Cu, Mg, Ca, K, Zn, Al, Si, P) y *Reactivos compuestos* (NaHCO₃, CH₃COOH, H₂O₂, NaOH)
- **Recetario ampliado**: de 13 a 27 reacciones, incluyendo óxidos, sales, ácidos, compuestos orgánicos y reacciones domésticas
- **Scroll gestual en el Recetario**: mover la mano sobre la lista desplaza el contenido sin mouse
- Nombres de elementos con tamaño de fuente adaptativo para evitar desbordamiento en cards de 90 px
- Botones de acción (Reaccionar, Vaciar, Recetario, Tutorial) con `hitMargin={4}` para eliminar activaciones accidentales simultáneas

### 🔤 Sílabas — modo inglés y pronunciación
- **Toggle de idioma** con HandButton (dwell + pinza): cambia entre 🇪🇸 Español y 🇺🇸 Inglés
- 12 palabras en inglés con división silábica: RABBIT, WINDOW, FLOWER, PENCIL, TIGER, BUTTER, MONKEY, MUSIC, UMBRELLA, TOGETHER, REMEMBER, COMPUTER
- Al completar una palabra: pronunciación automática vía Web Speech API (`en-US` / `es-ES` según idioma activo)
- Win overlay muestra el desglose animado de sílabas (`GA · TO`) con animación escalonada
- UI bilingüe: etiquetas de slots, instrucción y texto de victoria cambian con el idioma

### 🎯 Feedback pedagógico (todos los módulos)
- **SyllablesModule:** al soltar una sílaba incorrecta → toast `"X" no va en esa posición — busca "Y"`
- **EnglishModule:** al soltar palabra incorrecta → toast `"hint" en inglés → ANSWER`
- **MathAbacusModule:** al acertar → toast `3 + 5 + 7 = 15 ✓`; al pasarse → toast `Suma: 18 — necesitas exactamente 15`
- Toasts con color semántico: verde (correcto), ámbar (pista), rojo (error), duración 2.2 s, animación de entrada/salida

### ⚡ Rendimiento
- **Sistema Solar:** supresión de 450 ms en asteroides tras cerrar tarjeta informativa (evita spike de GPU al reanudar 150 partículas)
- **Puzzle:** eliminado `backdrop-blur-md` del overlay de victoria; añadido buffer de 220 ms al inicio de nivel para estabilizar el DOM tras re-montaje
- **Puzzle:** badge de progreso `🧩 N/total` en el header, cambia a cyan al colocar la primera pieza y a verde al completar

### 🐛 Correcciones
- **EnglishModule:** burbuja quedaba congelada (`isGrabbed: true`) si `getElementById` devolvía `null` durante re-render — ahora siempre se libera
- **EnglishModule:** zona de detección de drop ampliada de 10 % a 18 % de pantalla para facilitar la interacción gestual
- **SyllablesModule / EnglishModule:** patrón `wordBankRef` evita closures stale en efectos con `[]` al cambiar de idioma dinámicamente

## [2.2.0] — 2026-06-02

- **Nuevo juego — Laboratorio de Química**: mezcla elementos de la tabla periódica y descubre reacciones reales. Incluye un tutorial guiado de combinaciones sencillas (agua, sal, volcán) y un modo libre para experimentar. Enseña tanto reacciones seguras y curiosas como mezclas peligrosas que nunca deben hacerse en casa.
- **Menú reorganizado**: los módulos ahora se dividen en dos secciones — **Aprende** (educativos) y **Diversión** (juegos).

## [2.1.0] — 2026-06-01

- **Puzzle**: corrección de fragmentos vacíos, nuevas imágenes, nivel 3 (4×4) y sistema de pistas que se adapta según el nivel.
- **EcoGuardián**: basureros reubicados en la parte inferior y objetos de basura más grandes.
- **Sistema Solar**: ahora se seleccionan los planetas manteniendo el puntero sobre ellos; los botones de las tarjetas informativas funcionan de la misma forma. Se corrigió el botón de cierre.
- **Ball Crush**: velocidad automática por nivel, rebote corregido y mejor rendimiento general.
