# NewSkeleton — Scratch 3.0 con IA Multi-Agente & Tauri

Fork avanzado y potenciado de **Scratch 3.0** empaquetado como aplicación de escritorio nativa mediante **Tauri** (Rust), con un sistema integrado de **Inteligencia Artificial Multi-Agente**, simulación de circuitos, soporte de dispositivos de hardware, temas personalizados y compatibilidad con proyectos extendidos (`.flynt` y `.sb3`).

---

## 🚀 Características Principales

- **🤖 Sistema de IA Multi-Agente Integrado**:
  - **Director de Juego**: Diseña mecánicas, define objetivos, variables y estructura completa del juego.
  - **Agente Visual / Artista**: Selecciona y añade fondos y sprites desde la biblioteca local garantizada (sin timeouts de red) o genera recursos vectoriales.
  - **Programador Lógico**: Genera scripts de bloques Scratch limpios y funcionales, corrigiendo opcodes, tipos de datos y conexiones automáticamente antes de inyectarlos al VM en tiempo real.
  - **Verificador y Reconciliador**: Validación semántica de bloques, sombras, variables y broadcasts para prevenir errores de Blockly.
  - **Soporte Multimodelo**: Compatible con APIs compatibles con OpenAI, NVIDIA AI Foundation (Gemma, Llama, etc.), Gemini y modelos locales (Ollama).
- **🖥️ Aplicación de Escritorio con Tauri (Rust)**:
  - Rendimiento superior y bajo consumo de memoria comparado con Electron.
  - Empaquetado nativo para Windows (`.exe` / `.msi`), macOS y Linux.
- **🎨 Experiencia Visual y Personalización**:
  - Temas: Oscuro, Claro y Viaje en el Tiempo (Caturday, Old Timey, Nineties, Prehistoric).
  - Pestaña de IA dedicada, chat interactivo flotante y visualizador de flujogramas.
  - Diseñador visual con previsualizaciones y animación de arranque ("Fist Cat").
- **🔌 Hardware y Circuitos**:
  - Soporte para simulación de circuitos y placas físicas (Arduino, ESP32, stbBoard, micro:bit).
- **📦 Recursos Locales sin Conexión**:
  - Biblioteca completa de sprites, disfraces y sonidos pre-descargada localmente en `scratch-gui/static/library-assets/` para evitar caídas o demoras por CDN.

---

## 📁 Estructura del Repositorio

```text
NewSkeleton/
├── scratch-gui/       # Frontend React + Blockly + Componentes y Módulos de IA
│   ├── src/           # Código fuente de la interfaz
│   ├── static/        # Assets estáticos y biblioteca offline de disfraces/fondos
│   └── scripts/       # Scripts auxiliares de descarga de assets
├── scratch-vm/        # Máquina virtual y motor de ejecución de Scratch
├── src-tauri/         # Shell nativo de escritorio (Rust + Tauri)
├── backend/           # Servidor auxiliar Node.js
├── assets/            # Gráficos, SVGs y animaciones de marca
└── package.json       # Configuración raíz y workspaces npm
```

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas en tu sistema:

1. **Node.js**: Versión 18.x o 20.x LTS ([Descargar Node.js](https://nodejs.org/))
2. **npm**: Versión 9.x o superior (incluido con Node.js)
3. **Rust & Cargo** *(Solo para compilar la versión de escritorio Tauri)*:
   - En Windows, descarga e instala `rustup-init.exe` desde [rustup.rs](https://rustup.rs/).
4. **Visual Studio C++ Build Tools** *(En Windows)*:
   - Necesario para compilar dependencias nativas de Node (`node-gyp`) y paquetes de Rust.
   - Selecciona la carga de trabajo "Desarrollo para el escritorio con C++".

---

## 📥 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/gabrlrond2008-cmyk/NewSkeleton.git
   cd NewSkeleton
   ```

2. **Instalar todas las dependencias**:
   El proyecto utiliza **npm workspaces**, por lo que un único comando instala las dependencias de la raíz, `scratch-gui` y `scratch-vm`:
   ```bash
   npm install
   ```

3. *(Opcional)* **Actualizar la caché de recursos locales de la biblioteca**:
   Los assets principales ya vienen incluidos en `scratch-gui/static/library-assets/`. Si deseas re-sincronizarlos:
   ```bash
   node scratch-gui/scripts/download-library-assets.js
   ```

---

## 💻 Guía de Uso y Ejecución

### 1. Modo Desarrollo Web (Navegador)
Inicia el servidor de desarrollo con recarga rápida (HMR):
```bash
npm run start -w scratch-gui
```
Abre tu navegador en: [http://localhost:8601](http://localhost:8601)

### 2. Modo Aplicación de Escritorio (Tauri Dev)
Ejecuta la aplicación de escritorio completa en modo de depuración:
```bash
npm run tauri dev
```

### 3. Servidor Backend Auxiliar (Opcional)
Si utilizas el backend para puente de IA o extensiones especiales:
```bash
node backend/server.js
```

---

## 🏗️ Compilación para Producción

### Generar la interfaz web (Build estático):
```bash
npm run build -w scratch-gui
```
Esto genera los bundles optimizados en `scratch-gui/build/`.

### Generar el instalador de escritorio (Tauri Build):
```bash
npm run build -w scratch-gui
npm run tauri build
```
El instalador ejecutable (`.exe` o `.msi`) se generará en:
`src-tauri/target/release/bundle/`

---

## ⚙️ Configuración del Asistente de IA

1. Inicia la aplicación (Web o Escritorio).
2. Abre la pestaña **IA** en la barra superior o presiona el botón flotante del asistente.
3. En la sección de configuración (engranaje):
   - **Proveedor**: Selecciona tu proveedor preferido (NVIDIA NIM, Gemini, OpenAI, Ollama local, etc.).
   - **API Key**: Ingresa tu clave correspondiente (se almacena de forma segura en el almacenamiento local del navegador/aplicación).
   - **Modelo**: Selecciona el modelo deseado (ej. `google/gemma-4-31b-it`, `meta/llama-3.3-70b-instruct`, `gpt-4o`, etc.).

---

## 📝 Notas y Buenas Prácticas

- **Formato de Archivos**: Los proyectos se pueden guardar y abrir tanto en formato estándar Scratch (`.sb3`) como en el formato extendido del proyecto (`.flynt`).
- **Idiomas**: Soporte completo y traducción adaptada para **Español** e **Inglés**.
- **Modificaciones en workspaces**: `scratch-gui` y `scratch-vm` están vinculados localmente mediante workspaces. Cualquier cambio en ellos se refleja de inmediato sin necesidad de publicar en registros externos.

---

## 📄 Licencia

Este proyecto es un fork educativo y de código abierto basado en Scratch 3.0 (licencia MIT / Apache 2.0 / AGPL según los componentes respectivos de Scratch Foundation). Ver archivos individuales para detalles específicos de licencias.
