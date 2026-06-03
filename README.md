# EduMotion 🖐️✨

**EduMotion** es una plataforma educativa interactiva diseñada para la inclusión digital en entornos escolares (Fe y Alegría Ecuador). Utiliza **Inteligencia Artificial y Visión por Computadora** para permitir que los estudiantes interactúen con actividades lúdicas sin necesidad de tocar el mouse ni el teclado, utilizando únicamente los gestos de sus manos frente a la cámara web.

## 🚀 Misión del Proyecto
Facilitar el aprendizaje interactivo para niños con retos motrices o en etapas iniciales de desarrollo, eliminando las barreras físicas de entrada y convirtiendo el movimiento natural del cuerpo en una herramienta de aprendizaje.

## 🛠️ Tecnologías Utilizadas
- **Core:** [Electron](https://www.electronjs.org/) (Desktop App Framework)
- **Frontend:** [Vue.js 3](https://vuejs.org/) (Composition API)
- **Motor de IA:** [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) (Google)
- **Estilos:** [TailwindCSS](https://tailwindcss.com/)
- **Gestión de Estado:** Vue Composition API y LocalStorage/SessionStorage.
- **Empaquetado:** electron-builder.

## 🎮 Módulos Educativos
1.  **Pizarra de Dibujo:** Creatividad libre guiada por el dedo índice.
2.  **Piano Mágico:** Iniciación musical y relación causa-efecto mediante gestos.
3.  **Rompecabezas (Puzzle):** Lógica espacial utilizando el gesto de "pinza" para mover objetos.

## 🔐 Acceso Docente (Login)
La aplicación cuenta con una pantalla de acceso protegida para que los profesores gestionen la sesión.

**Credenciales Predeterminadas:**
- **Usuario Administrador:** `admin` | **Contraseña:** `123`
- **Usuario Profesor:** `profesor` | **Contraseña:** `123`

*Nota: La sesión expira automáticamente al cerrar la aplicación para garantizar la seguridad en equipos compartidos.*

## 🚀 Descarga Directa (Versión Beta)

Si deseas probar la aplicación sin realizar la instalación de desarrollo, puedes descargar la versión beta precompilada para Windows:

1.  **Descargar desde Google Drive:** [Enlace de Descarga Beta](https://drive.google.com/drive/folders/1PWRW1HKfjc5-y0pY89uucKQQTns8jPLd?usp=drive_link)
2.  **Descomprimir:** Extrae el contenido del archivo `.zip` en una carpeta de tu PC.
3.  **Ejecutar:** Busca el archivo `EduMotion.exe` (o similar dentro de la carpeta `dist_electron`) y ejecútalo directamente.

---

## ⚙️ Instalación para Desarrolladores

### Requisitos
- Node.js (v18 o superior)
- Webcam funcional

### Ejecución en modo desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (Vite + Electron)
npm run electron:dev
```

### Generar instalador para Windows (.exe)
```bash
npm run electron:build
```

---
Desarrollado con ❤️ para Fe y Alegría Ecuador.
