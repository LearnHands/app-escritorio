# LearnHands (app-escritorio) 🖐️✨

**LearnHands** es una plataforma educativa interactiva nativa para escritorio diseñada para la inclusión digital en entornos escolares de **Fe y Alegría Ecuador**. Utiliza **Inteligencia Artificial y Visión por Computadora** en tiempo real para permitir que los estudiantes interactúen con actividades lúdicas sin necesidad de tocar el mouse ni el teclado, utilizando exclusivamente gestos naturales de sus manos frente a la cámara web.

La aplicación está diseñada para funcionar de forma **100% offline** en las computadoras de los laboratorios escolares que no cuentan con acceso a internet.

---

## 📂 Estructura del Proyecto

El proyecto está empaquetado como una aplicación de escritorio híbrida mediante **Electron** y construida con **React (v19.x)** y **Vite**:

- **`/electron`**: Contiene el proceso principal de Electron (`main.js`). Aquí se configura la ventana del sistema, el modo quiosco, la inhabilitación del mouse/teclado y la integración con el sistema operativo.
- **`/src`**: Código fuente del Frontend en React:
  - **`/components`**: Componentes visuales genéricos y wrappers.
  - **Módulos Educativos**: Carpeta con la lógica individual de cada uno de los 17 juegos interactivos.
  - **`SystemHub.jsx`**: El panel principal de navegación y enrutamiento gestual de los módulos.
  - **`main.jsx`**: Punto de entrada de la aplicación SPA.
- **`/scripts`**: Scripts de utilidad para automatización del flujo de desarrollo (ej. `kill-port.mjs` para liberación de puertos de red).
- **`/dist`**: Carpeta generada dinámicamente por Vite al compilar los activos frontend. *(Ignorado en Git)*.
- **`/dist-electron`**: Carpeta que contiene los archivos empaquetados e instalables nativos `.exe` generados para Windows. *(Ignorado en Git)*.

---

## 🎮 Módulos Educativos Incluidos (17 Módulos)

La plataforma cuenta con 17 módulos lúdicos interactivos que abarcan diferentes disciplinas y niveles:

1.  **Pizarra de Dibujo:** Creatividad guiada por la punta del índice.
2.  **Piano Mágico:** Iniciación musical interactiva.
3.  **Rompecabezas (Puzzle):** Lógica espacial arrastrando piezas con pinzas digitales.
4.  **Módulo de Circuitos Eléctricos:** Encendido y conexión de interruptores gestuales.
5.  **Módulo de Átomos:** Simulación de estados físicos del átomo según altura de la mano.
6.  **Bloques de Programación (Coding Blocks):** Introducción al código guiando un robot.
7.  **Módulo de Contabilidad:** Gestión contable con balance dinámico.
8.  **Línea de Tiempo:** Ordenamiento cronológico de eventos históricos.
9.  **Anatomía Humana:** Mapa interactivo SVG del cuerpo humano y sus sistemas.
10. *(Y otros módulos interactivos diseñados para el desarrollo de motricidad y aprendizaje lógico).*

---

## ⚙️ Instalación para Desarrolladores

### Requisitos Previos:
- **Node.js v20.x** o superior y **npm**
- Cámara web (webcam) conectada y activa

### Pasos de Instalación:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/LearnHands/app-escritorio.git
   cd app-escritorio
   ```

2. **Instalar las dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Ejecutar en entorno de desarrollo:**
   Para lanzar la aplicación de Electron con recarga en caliente de Vite:
   ```bash
   npm run electron:dev
   ```

4. **Compilar y Generar el instalador para Windows (`.exe`):**
   ```bash
   npm run electron:build
   ```
   El instalador ejecutable final se creará dentro del directorio `/dist-electron`.

---

## 🔑 Variables de Entorno (`.env`)

Dado que la aplicación de escritorio está diseñada para ejecutarse de manera **local y offline**, no requiere de un archivo de configuración de entorno `.env` en producción. La configuración de tracking de manos, rutas locales de WebAssembly y persistencia temporal se manejan directamente a nivel de código y a través del `localStorage` interno de Chromium.

---

## ⚖️ Declaración de Tecnologías de Terceros y Licencias

En conformidad con los requisitos académicos del curso de Aspectos Legales, se listan a continuación las librerías de terceros y sus licencias SPDX válidas:

| Nombre de la Librería / Framework | Rol en el Proyecto | Tipo de Licencia (SPDX) |
| :--- | :--- | :--- |
| **Electron (v28.x)** | Entorno de ejecución de escritorio nativo (Chromium + Node) | `MIT` |
| **React (v19.x)** | Framework SPA para el desarrollo modular de la UI | `MIT` |
| **React DOM (v19.x)** | Renderizado reactivo de los componentes | `MIT` |
| **Vite (v6.x)** | Empaquetador frontend rápido y recarga en caliente | `MIT` |
| **MediaPipe Tasks-Vision (v0.10.x)** | Modelo de Machine Learning WebAssembly para Hand Tracking | `Apache-2.0` |
| **Framer Motion (v11.x)** | Animación fluida de cartas, menús y gestos | `MIT` |
| **Lucide React (v0.400.x)** | Iconos interactivos para los módulos educativos | `ISC` |
| **Tailwind CSS (v4.x)** | Estilización visual del videojuego y módulos | `MIT` |
| **Electron Builder** | Herramienta de compilación para generar el instalador `.exe` | `MIT` |
| **Sharp** | Compresión y procesamiento de imágenes offline | `Apache-2.0` |

---

## 👩‍💻 Deslinde de Autoría y Transparencia en el Uso de IA

- **Código Propio:** El equipo ha desarrollado en su totalidad la lógica de los 17 módulos de juego reactivos, la calibración de suavizado tridimensional de mano (bucle LERP), la detección del retardo temporal para selección gestual (*dwell time*), y la inhabilitación del mouse/teclado a través del proceso principal de Electron.
- **Uso de Inteligencia Artificial (Honestidad Académica):** Declaramos transparentemente haber utilizado herramientas de Inteligencia Artificial (**Gemini** y **Claude**) como asistentes de programación. Su uso facilitó la optimización de los fotogramas (FPS) del motor de renderizado Canvas en hardware escolar antiguo, la depuración matemática de la matriz de tracking tridimensional, y la redacción de la documentación del proyecto. El control conceptual del diseño educativo y la toma de decisiones finales corresponden enteramente al equipo de desarrollo humano, quien sustentará y defenderá el código en vivo.

---

## 📄 Licencia

Este repositorio se distribuye bajo los términos de la licencia **MIT**. Consulta el archivo `LICENSE` en la raíz del proyecto para ver el texto legal completo.
