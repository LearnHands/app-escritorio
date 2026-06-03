# Registro de cambios — LearnHands

## [3.0.0] — 2026-06-03

### Nuevos módulos educativos

- **Circuitos eléctricos**: Diagrama interactivo con 5 niveles (serie, serie doble, paralelo, resistencias, mixto). Activa interruptores con la mano para completar el circuito y encender el LED; animación de glow en cables activos.
- **Movimiento de átomos**: Simulación de partículas que transita entre sólido, líquido y gas según la temperatura. La altura de la mano controla la temperatura (0–100 °C). Tres sustancias disponibles: agua, hierro y oxígeno.
- **Bloques de programación gestual**: Robot guiado por secuencias de comandos gestuales sobre una cuadrícula 10×7 con obstáculos. Incluye modificador de repetición (×1/×2/×3) y 5 niveles de dificultad creciente.
- **Contabilidad gestual**: Libro de cuentas interactivo con 12 transacciones, balance en tiempo real, barra de salud financiera y 4 consejos de educación financiera. Saldo inicial: $500.
- **Líneas de tiempo — Historia**: Juego de ordenamiento cronológico con 12 eventos históricos globales y de Ecuador, distribuidos en 4 rondas de 4 eventos cada una.
- **Anatomía interactiva**: Silueta corporal SVG con 8 regiones exploradas por dwell gestual. Cinco sistemas anatómicos (esquelético, muscular, circulatorio, digestivo, nervioso) con 40 tarjetas de información únicas. El anillo de progreso visual indica cuánto falta para seleccionar una región.

### Gestos y control

- **Sistema 100 % hands-only**: El mouse y el teclado están completamente bloqueados a nivel global. La aplicación sólo responde al seguimiento de manos de MediaPipe.
- **Pellizco para desplazar el menú**: Juntar el dedo índice y el pulgar (gesto de pinza) activa el modo arrastre. Mover la mano mientras se pellizca desplaza la lista de módulos. Al soltar el pellizco se reanuda la activación normal de botones (300 ms de gracia).
- **Menú corregido**: El contenedor de módulos ahora hace scroll real gracias a la corrección de `flex-1 + min-h-0`. Los 16 módulos (11 educativos + 5 de juego) son accesibles sin que ninguno quede oculto.

### Correcciones

- **Anatomía — detección de órganos**: El módulo usaba el div padre para normalizar coordenadas; ahora usa el bounding rect del propio elemento `<svg>`, eliminando el desfase de posición. La selección por click fue reemplazada por dwell gestual con anillo de progreso visible.

---

## [2.2.0] — 2026-06-02

- **Nuevo juego — Laboratorio de Química**: mezcla elementos de la tabla periódica y descubre reacciones reales. Incluye un tutorial guiado de combinaciones sencillas (agua, sal, volcán) y un modo libre para experimentar. Enseña tanto reacciones seguras y curiosas como mezclas peligrosas que nunca deben hacerse en casa.
- **Menú reorganizado**: los módulos ahora se dividen en dos secciones — **Aprende** (educativos) y **Diversión** (juegos).

## [2.1.0] — 2026-06-01

- **Puzzle**: corrección de fragmentos vacíos, nuevas imágenes, nivel 3 (4×4) y sistema de pistas que se adapta según el nivel.
- **EcoGuardián**: basureros reubicados en la parte inferior y objetos de basura más grandes.
- **Sistema Solar**: ahora se seleccionan los planetas manteniendo el puntero sobre ellos; los botones de las tarjetas informativas funcionan de la misma forma. Se corrigió el botón de cierre.
- **Ball Crush**: velocidad automática por nivel, rebote corregido y mejor rendimiento general.
