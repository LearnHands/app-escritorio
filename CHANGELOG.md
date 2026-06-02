# Registro de cambios — LearnHands

---

## [2.1.0] — 2026-06-01

### 🧩 Módulo Puzzle — mejoras completas

- **Corrección de tiles vacíos**: los fragmentos del puzzle ahora usan `background-image` con recorte CSS en lugar de imágenes absolutamente posicionadas, eliminando los cuadros transparentes en columnas > 0.
- **Nivel 3 (4×4)**: se añade un tercer nivel con cuadrícula de 4×4 piezas.
- **Imágenes reales**: 10 imágenes originales en alta calidad (colibrí, unicornio, formas, tucanes, gatito, abeja, astronauta, helado espacial, aventurero, montañas), procesadas a 600×600 px.
- **Carpeta de imágenes personalizadas**: se pueden añadir imágenes propias en `src/assets/puzzle/` y se cargan automáticamente.
- **Sistema de pistas adaptativo**: en lugar de mostrar todas las piezas tenues, ahora se revelan solo N ranuras aleatorias como pista visual:
  - Nivel 1 (2×2): 2 pistas
  - Nivel 2 (3×3): 5 pistas
  - Nivel 3 (4×4): 4 pistas

---

### 🌎 EcoGuardián — ajustes de usabilidad

- Los **basureros se desplazaron a la parte inferior** de la pantalla para una interacción más natural.
- Los **objetos de basura** que caen son ahora más grandes (de 64 px a 96 px) para facilitar su captura con gestos.

---

### 🪐 Sistema Solar — interacción rediseñada

- **Selección por permanencia (dwell)**: mantener el puntero sobre un planeta durante 1.2 segundos abre su tarjeta informativa. Se dibuja un arco amarillo de progreso en el canvas.
- **Eliminación del conflicto de gestos**: la pinza ya no selecciona planetas. La primera mano que pellizca mueve el sistema (pan); la segunda hace zoom vertical.
- **Botones de tarjeta por dwell**: pasar 0.8 segundos sobre cualquier botón (siguiente, anterior, cerrar, puntos de paginación) lo activa. Un arco de color indica el progreso.
- **Botón cerrar corregido**: `id="solar-close-btn"` con área táctil de 48×48 px — funciona de forma confiable con dwell y también con pinza fuera de la tarjeta.
- **Período de gracia reducido** de 550 ms a 150 ms para respuesta más ágil.

---

### 🎮 Ball Crush — física y rendimiento

- **Velocidad automática por nivel**: se elimina el control deslizante manual. La velocidad crece con cada nivel (L1 = 9, L2 = 10.5, L3 = 12 … máximo 20).
- **Corrección de rebote (MPV)**: el algoritmo de Mínima Penetración Vectorial calcula el eje de menor solapamiento para rebotar la bola. Ya no atraviesa bloques de 1 HP ni filas completas.
- **Flag `bouncedThisFrame`**: garantiza solo un rebote por frame por bola (la bola de fuego conserva su capacidad de penetración).
- **Mejora de rendimiento**: eliminada la cuadrícula de fondo (~50 draw calls/frame) y el `shadowBlur` de las partículas (carga GPU), reduciendo la caída de FPS al detectar la mano.

---

### 🛠 Desarrollo / Infraestructura

- **`electron:dev` sin conflicto de puerto**: el script `scripts/kill-port.mjs` libera automáticamente el puerto 5173 antes de arrancar Vite, evitando el error _"Port already in use"_ al reiniciar.

---

*LearnHands es una plataforma educativa de gestión natural para Fe y Alegría Ecuador.*
*Controlada 100 % con la mano — sin ratón ni teclado.*
