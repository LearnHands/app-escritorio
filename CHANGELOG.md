# Registro de cambios — LearnHands

## [3.0.0] — 2026-06-03 · Lanzamiento mayor

### 🆕 Seis nuevos módulos educativos · Total: 17 módulos

| Módulo | Área | Mecánica gestual |
|--------|------|-----------------|
| **Circuitos Eléctricos** | Física | Dwell sobre interruptores para cerrar o abrir el circuito; animación de glow en cables activos cuando la corriente fluye |
| **Movimiento de Átomos** | Química/Física | Altura de la mano controla la temperatura 0–100 °C; las partículas transitan sólido → líquido → gas en tiempo real sobre canvas |
| **Bloques de Programación** | Computación | Dwell para añadir comandos (derecha/izquierda/arriba/abajo/saltar/repetir) a una secuencia; el robot la ejecuta al pinchar "Ejecutar" |
| **Contabilidad Gestual** | Finanzas | Dwell para registrar 12 transacciones (ingresos y gastos); balance en tiempo real con barra de salud financiera y 4 consejos |
| **Líneas de Tiempo — Historia** | Historia | Arrastrar 4 tarjetas de eventos históricos al orden cronológico correcto en 4 rondas temáticas |
| **Anatomía Interactiva** | Biología | Silueta corporal SVG con 8 regiones; dwell con anillo de progreso visible para seleccionar; 5 sistemas × 8 regiones = 40 tarjetas únicas |

### 🖐️ Sistema 100 % hands-only
- Mouse y teclado bloqueados globalmente: la aplicación **solo responde** al seguimiento de manos MediaPipe
- **Pellizco para desplazar el menú**: juntar índice + pulgar activa modo arrastre; soltar el pellizco tiene 300 ms de gracia antes de reanudar dwell en botones
- **Scroll real del menú corregido**: contenedor con `flex-1 + min-h-0` permite que `overflow-y-auto` funcione correctamente con 17 módulos
- Hint visual en el menú: `🤏 Pellizca índice + pulgar y arrastra para desplazar`

### 🔧 Correcciones v3.0.0
- **Anatomía — desfase de órganos**: el módulo usaba el div padre para normalizar coordenadas; ahora usa el `getBoundingClientRect()` del propio `<svg>`, eliminando el error de posición en pantallas no cuadradas
- **LayeredEngine**: mejoras de composición para que el anillo de progreso de Anatomía sea visible por encima del canvas de landmarks
- **HandButton**: micro-optimización de lectura de refs para reducir allocations en loops de 60 fps

---

## [2.3.0] — 2026-06-03

### 🆕 Nuevo módulo — English (Inglés)
- Juego de oraciones en inglés con burbujas de palabras que caen desde arriba
- **Nivel 1 — Básico:** 1 hueco por oración; verbos simples y adjetivos cotidianos
- **Nivel 2 — Intermedio:** 1 hueco por oración; tiempos pasados y oraciones más largas
- **Nivel 3 — Avanzado:** **2 huecos por oración**; voz pasiva, perfecto continuo y condicionales (12 oraciones)
- **Snap gestual**: acercar la burbuja correcta a ≤ 80 px del hueco la engancha automáticamente sin necesidad de soltar (igual que Sílabas)
- Al completar todos los huecos: pronunciación automática de la oración completa vía Web Speech API (`en-US`) con velocidad 0.75×
- Botones subir/bajar nivel con HandButton (dwell 1.2 s + pinza)
- Puntos escalables: 60 / 100 / 150 pts × número de huecos completados

### 🔤 Sílabas — modo inglés + pronunciación
- **Toggle de idioma** reemplazado por HandButton (dwell 1.2 s + pinza): cambia entre 🇪🇸 Español y 🇺🇸 Inglés con el gesto de la mano
- 12 palabras en inglés con división silábica: RABBIT, WINDOW, FLOWER, PENCIL, TIGER, BUTTER, MONKEY, MUSIC, UMBRELLA, TOGETHER, REMEMBER, COMPUTER
- Al completar una palabra: **pronunciación automática** vía Web Speech API (`en-US` / `es-ES` según idioma activo, velocidad 0.75×, pausa 650 ms post-victoria)
- Win overlay: muestra el desglose animado de sílabas (`GA · TO`) con animación escalonada por `motion.span`
- UI bilingüe: etiquetas de slots, instrucción y texto de victoria cambian dinámicamente con el idioma activo
- `langRef` pattern: ref actualizado cada render para que el RAF loop de `[]` deps acceda al idioma actual sin reinicios

### 🔬 Laboratorio de Química — overhaul mayor
- **Dos secciones en la paleta**: *Elementos base* (16 elementos reales: H, O, N, C, S, Na, Cl, Fe, Cu, Mg, Ca, K, Zn, Al, Si, P) y *Reactivos compuestos* (NaHCO₃, CH₃COOH, H₂O₂, NaOH)
- **Recetario ampliado**: de 13 → **27 reacciones** incluyendo óxidos, sales, ácidos, compuestos orgánicos y reacciones domésticas (volcán, jabón, blanqueador peligroso)
- **Scroll gestual en el Recetario**: mover la mano sobre la lista desplaza el contenido sin mouse
- Fuente adaptativa en cards de 90 px para nombres largos de elementos
- Botones de acción (Reaccionar, Vaciar, Recetario, Tutorial) con `hitMargin={4}` para prevenir activaciones accidentales simultáneas

### 🎯 Feedback pedagógico en tiempo real
- **SyllablesModule**: sílaba incorrecta → toast ámbar `"X" no va en esa posición — busca "Y"`
- **EnglishModule**: palabra incorrecta → toast ámbar `"WRONG" → ANSWER` en inglés
- **MathAbacusModule**: acierto → toast verde `3 + 5 + 7 = 15 ✓`; pasarse del objetivo → toast rojo `Suma: 18 — necesitas exactamente 15`
- Toasts semánticos: verde (correcto), ámbar (pista), rojo (error) · duración 2.2 s · entrada/salida con `framer-motion`

### ⚡ Rendimiento
- **Sistema Solar**: supresión de 450 ms en asteroides tras cerrar tarjeta informativa (evita spike de GPU al reanudar ~150 partículas)
- **Puzzle**: eliminado `backdrop-blur-md` del overlay de victoria; buffer de 220 ms al inicio de nivel para estabilizar el DOM
- **Puzzle**: badge de progreso `🧩 N/total` en el header; color blanco/30 → cyan → verde según piezas colocadas

### 🐛 Correcciones
- **EnglishModule**: burbuja congelada (`isGrabbed: true`) cuando `getElementById` devolvía `null` durante re-render; ahora siempre se libera con flag `droppedOnSlot`
- **EnglishModule**: zona de detección de drop ampliada de 10 % → 18 % de pantalla
- **SyllablesModule / EnglishModule**: patrón `wordBankRef` / `langRef` evita closures stale en efectos con `[]` al cambiar idioma dinámicamente
- **EnglishModule multi-hueco**: `shouldRemove` flag en snap; release path maneja `bi === -1` limpiamente sin freeze

---

## [2.2.0] — 2026-06-02

- **Nuevo módulo — Laboratorio de Química**: mezcla libre de elementos con botón "Reaccionar", Recetario (15 recetas iniciales), tutorial guiado de 3 pasos (agua, sal, volcán), modo Skip. Enseña reacciones seguras y peligrosas.
- **Menú reorganizado**: módulos divididos en dos secciones — **Aprende** (educativos) y **Diversión** (juegos interactivos)
- **LifeLostOverlay**: animación de vidas perdidas añadida a Balls Crush y Reciclaje
- **Sistema Solar**: cursor + anillo de progreso renderizados en DOM (no canvas), blur eliminado, close solo por botón dedicado
- **Reciclaje**: render a 30 fps (setState desacoplado de la lógica de 60 fps) para reducir repaints
- **HandButton**: throttle a 30 fps, caché de `getBoundingClientRect`, re-entrada requerida tras disparo, grace period configurable

---

## [2.1.0] — 2026-06-01

- **Puzzle**: corrección de fragmentos vacíos, nuevas imágenes de alta resolución, Nivel 3 (cuadrícula 4×4) y sistema de pistas adaptativo por nivel
- **EcoGuardián**: basureros reubicados en la parte inferior de pantalla; objetos de basura con hitbox más grande
- **Sistema Solar**: planetas seleccionados con dwell (mantener puntero); botones de tarjetas informativas con el mismo sistema; corrección del botón de cierre
- **Balls Crush**: velocidad automática por nivel, rebote corregido, mejora general de rendimiento
