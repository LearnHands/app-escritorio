# Registro de cambios — LearnHands

## [5.0.0] — 2026-06-24 · Despliegue en Producción y Depuración de Artefactos de Desarrollo

### 🌐 Migración al Servidor de Producción LearnHands
- **URL de API unificada:** La aplicación apunta ahora exclusivamente a `https://learnhands.edutecsalpuce.com` como servidor de producción de la plataforma LearnHands / Fe y Alegría Ecuador. Se eliminó completamente la dependencia del servidor de desarrollo `autocomerciojvc.com`.
- **Inicio de sesión docente en línea:** El login de profesor realiza autenticación contra la API real (`POST /api/auth/login`). El acceso queda deshabilitado automáticamente cuando no hay conexión a internet.
- **Sincronización de métricas de juego:** Las partidas completadas se envían a `POST /api/metrics` del nuevo servidor. Si el dispositivo está offline, las métricas se encolan en `localStorage` y se sincronizan automáticamente al recuperar conexión.
- **Registros de estudiantes:** El flujo de registro con validación de cédula ecuatoriana usa `POST /api/auth/register` del servidor de producción.
- **Panel de ajustes — URL configurable:** El campo de URL de la API muestra `https://learnhands.edutecsalpuce.com` como valor por defecto. El botón de restablecimiento de URL fue actualizado de "Restablecer JVC" a "Restablecer".

### 🧹 Eliminación de Referencias de Usuario de Desarrollo
- **Campo de usuario docente vacío por defecto:** Al activar el modo "Acceso Docente" en la pantalla de login, el campo de usuario ya no se prellenaba con el nombre de la usuaria de prueba. Ahora el campo queda vacío para que el docente ingrese su usuario real.
- **Cadenas de interfaz genéricas:** Se actualizaron los textos de la UI para que no mencionen nombres de usuarios específicos:
  - El título del modo docente pasó de `"Acceso Docente (KathePastaz)"` a `"Acceso Docente"`.
  - El mensaje de error de credenciales pasó de `"Solo el usuario KathePastaz tiene rol de profesora."` a `"Usuario o contraseña incorrectos."`.
  - El encabezado del panel docente pasó de `"Dashboard de la Profesora KathePastaz"` a `"Dashboard Docente"`.
  - Los equivalentes en inglés fueron actualizados con la misma lógica.
- **Datos de semilla de diagnóstico limpios:** Se eliminó el nombre de la usuaria de prueba del conjunto de datos sintéticos utilizados por `uxTracker.js` para inicializar el historial de métricas UX local.
- **Nombres de módulos de juego corregidos en la cola de sincronización:** Las claves de módulo en los datos de semilla de `sync.js` fueron reemplazadas por las claves canónicas del servidor de producción (`PIZARRA`, `PIANO`, `PUZZLE`, `BRICKS`, `SILABAS`, `ECO`, `ABACUS`, `SOLAR`, `FORMAS`).

### 📦 Resultado
Esta versión marca el **cierre del ciclo de prototipo** y la **entrada a producción completa** de la aplicación de escritorio LearnHands. Todos los artefactos, credenciales de prueba y referencias a entornos de desarrollo anteriores han sido removidos del código fuente y de la interfaz de usuario.

---

## [4.2.0] — 2026-06-20 · Apuntar API al Servidor de Producción LearnHands

### 🌐 Cambio de Servidor de API
- `DEFAULT_API_URL` en `sync.js` actualizado de `https://autocomerciojvc.com` a `https://learnhands.edutecsalpuce.com`.
- El `placeholder` y el valor de restablecimiento del campo de URL en el panel de configuración de la aplicación fueron actualizados en consecuencia.

---

## [4.1.2] — 2026-06-15 · Cierre de Sesión para Docentes y Compilación Limpia

### 🔑 Sesiones y Control de Usuarios
- **Cerrar Sesión (Docente):** Se habilitó un botón gestual de **Cerrar Sesión** en la pantalla principal (`HOME`) exclusivo para usuarios con rol de profesor (`userRole === 'teacher'`). Esto permite limpiar las credenciales guardadas en local y regresar a la pantalla de login sin necesidad de reiniciar la aplicación.

---

## [4.1.1] — 2026-06-15 · Corrección de Fallas Críticas, Diagnósticos y Rendimiento

### 🛠️ Corrección de Fallas Críticas de Runtime
- **Sistema Solar:** Se solucionó el error `ReferenceError: useCallback is not defined` al importar correctamente `useCallback` en React en [SolarSystemModule.jsx](file:///c:/laragon/www/EduMotion/src/components/hub/modules/SolarSystemModule.jsx).
- **Sílabas:** Se corrigió el error `ReferenceError: setParticles is not defined` al reemplazar la llamada al set de estado inexistente por la asignación directa sobre la referencia autoritativa de físicas `s.particles = []` en [SyllablesModule.jsx](file:///c:/laragon/www/EduMotion/src/components/hub/modules/SyllablesModule.jsx).
- **Puesta en Marcha (Startup):** Se resolvió el error `ReferenceError: useCallback is not defined` en el arranque de la aplicación al agregar el import de `useCallback` en [SystemHub.jsx](file:///c:/laragon/www/EduMotion/src/SystemHub.jsx).

### 🩺 Contención de Fallas y Logs de Diagnóstico
- **Barrera de Seguridad (Error Boundary):** Se diseñó el componente [GameErrorBoundary.jsx](file:///c:/laragon/www/EduMotion/src/components/hub/GameErrorBoundary.jsx) (ubicado por fuera del Suspense de carga en [SystemHub.jsx](file:///c:/laragon/www/EduMotion/src/SystemHub.jsx)) para aislar fallas fatales de renderizado en cualquier juego. En lugar de una pantalla en negro, se le presenta al usuario una pantalla informativa de error con la traza de ejecución del fallo y la opción de volver al menú.
- **SVGs en Línea para Diagnósticos:** Se reescribió la barrera de error para utilizar SVGs en línea, eliminando dependencias de importación de Lucide que pudiesen causar crashes por diferencias de nomenclatura de versiones.
- **Monitoreo de Excepciones:** Se agregaron listeners globales de error (`window.addEventListener('error')`) y bloques de contención `try/catch` en los bucles de actualización física del *Sistema Solar* y de *Sílabas* para capturar y reportar cualquier falla de runtime directamente en la auditoría local (`localStorage`) mediante `addLocalLog`.

### 🎮 Ajustes de Interacción y Usabilidad
- **Verbos Irregulares:** Se modificó la colisión en [IrregularVerbsModule.jsx](file:///c:/laragon/www/EduMotion/src/components/hub/modules/IrregularVerbsModule.jsx) para no soltar ni rebotar forzosamente la burbuja de la mano al tocar un cuadro de destino incorrecto. Se restará únicamente una vida al tocar por primera vez el cuadro incorrecto (y otra en caso de re-entrada). Asimismo, se bloquea la colocación de un verbo correcto en su cuadro correspondiente si éste se encuentra cruzado o sobrepuesto sobre el cuadro incorrecto, obligando al usuario a arrastrarlo hacia afuera antes de clasificarlo.

### ⚡ Rendimiento Superior en Pantalla Gestual
- **Remoción de Backdrop Blur:** Se quitó la clase de filtro pesado `backdrop-blur-md` en el overlay de transición gestual en [SystemHub.jsx](file:///c:/laragon/www/EduMotion/src/SystemHub.jsx), lo cual eliminó el cuello de botella que causaba caídas severas de FPS sobre el canvas de seguimiento de manos.
- **Remoción de Transición CSS Conflictiva:** Se eliminó la transición CSS en la barra de progreso del tutorial para evitar tirones y desincronizaciones con el frame loop del navegador.

---

## [4.1.0] — 2026-06-14 · Optimización Mayor de Rendimiento y CPU

### ⚡ Reducción Crítica de Re-renders de React
- **Desacoplamiento de physical loop y renderizado:** Evitamos actualizaciones incondicionales de `setState` a 60 FPS dentro de los bucles `requestAnimationFrame`, lo cual eliminó el cuello de botella que causaba tirones y lag en el seguimiento de manos.
- **Mapeo directo de elementos en el DOM:**
  - **Burbujas Flotantes:** En los juegos de *Inglés*, *Verbos Irregulares*, *Sílabas* y *Abaco Matemático*, las burbujas se renderizan estáticamente en React, y sus coordenadas (`style.left`, `style.top`, `style.transform`) e interacción (`isGrabbed`) se modifican directamente a través del DOM en cada frame.
  - **Anillo de Dwell de Anatomía:** En `AnatomyModule.jsx`, se eliminó el estado de carga React a 60 FPS, manipulando la propiedad SVG `stroke-dashoffset` directamente en el DOM.
  - **Cursor de Tarjetas:** En `SolarSystemModule.jsx`, se removió el estado condicional de renderizado, y el cursor personalizado de la tarjeta informativa se posiciona directamente mediante DOM.
- **Partículas en Canvas de Alto Rendimiento:**
  - Las partículas de éxito/error en los juegos de lenguaje (*Inglés*, *Verbos Irregulares* y *Sílabas*) se movieron a un lienzo `<canvas>` HTML5 dedicado acelerado por hardware, eliminando la creación/destrucción masiva de nodos DOM.
- **Throttles y Guardas Inteligentes:**
  - En `AtomsModule.jsx`, la física de los átomos se calcula a 60 FPS con refs, pero la actualización del estado de temperatura de React está limitada (throttled) a 15 FPS.
  - En `BricksModule.jsx` y `EcoGuardianModule.jsx`, la sincronización de vidas, puntajes y estados con React ahora está guardada mediante referencias mutables para re-renderizar la UI únicamente cuando los valores numéricos cambien en el motor de físicas.

---

## [4.0.0] — 2026-06-14 · Circuitos Sandbox, Dashboard de Métricas y Correcciones

### 🆕 Simulador Sandbox de Circuitos (`CircuitsModule.jsx`)
- Reemplazo completo del módulo tradicional de circuitos por un **Sandbox Interactivo de Simulación Eléctrica**.
- **Panel de Componentes:** Posibilidad de añadir baterías, LEDs, resistencias, interruptores y condensadores al lienzo.
- **Lógica de Conexión:** Dwell-click sobre las terminales de los componentes para tender cables flexibles SVG de forma intuitiva.
- **Lógica de Movimiento:** Modo de arrastre y reposicionamiento para crear diagramas de circuitos limpios.
- **Motor de Simulación Física:**
  - Validación de circuitos abiertos y cerrados usando algoritmos de búsqueda en grafos.
  - Alerta de **Cortocircuito** si se conecta la batería directamente sin una resistencia o LED.
  - Alerta de **LED Quemado** si el LED se conecta directo sin una resistencia limitadora de corriente.
  - Animación de partículas y destellos luminosos en cables activos al cerrar el circuito de forma correcta.

### 📊 Dashboard de Métricas y Analíticas en Landing Page (HOME)
- Integración de un panel analítico en la pantalla de inicio, accesible mediante el botón de estadísticas.
- Métricas en tiempo real basadas en la base de datos local (`learnhands_metrics_history` y `learnhands_ux_history`).
- Gráficos interactivos SVG para:
  - Puntajes Promedio por Juego.
  - Línea de Tiempo de Actividad (Sesiones).
  - Popularidad de Módulos (Uso).
  - Análisis de Precisión y Autonomía UX.
- Capacidad de filtrar métricas por alumno específico.

### 📶 Modo Offline: Seguridad en Inicio de Sesión
- Detección automática del estado de conexión a Internet (`navigator.onLine`).
- Si la aplicación de escritorio se inicia **sin conexión a internet**, se bloquea/deshabilita el inicio de sesión como **Profesor** (ya que requiere sincronización con la base de datos o almacenamiento en la nube).
- Acceso exclusivo como **Estudiante** en modo offline, con advertencia en interfaz ("⚠️ Sin conexión: Solo acceso como Estudiante").

### 🔧 Correcciones de Interacción y Overlays
- **Bloqueo de Overlays:** Bloqueo de colisiones y clicks/hovers de fondo mientras existan overlays informativos en `AnatomyModule`, `CodingBlocksModule`, `AtomsModule` y `AccountingModule`.
- **Bloques de Código (`CodingBlocksModule`):**
  - Avance de nivel automático (timeout de 2 segundos) al completar con éxito el algoritmo.
  - Redistribución de botones de control (Ejecutar, Borrar, Reiniciar, Pista) en una rejilla de 2x2 más espaciosa y con mayor dwell time (`dwellMs=900`) para evitar activaciones dobles en pantallas táctiles.

---

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
