# Scratch Tauri

Fork de Scratch 3.0 con asistente IA, simulación de circuitos, soporte para dispositivos físicos y más, empaquetado como aplicación de escritorio con Tauri.

## Estructura del proyecto

```
scratch-tauri/
├── scratch-gui/       # Frontend React (fork de scratch-gui)
├── scratch-vm/        # Motor VM (fork de scratch-vm)
├── src-tauri/         # Shell de escritorio (Tauri + Rust)
├── backend/           # Servidor backend (Node.js)
├── package.json       # Workspace raíz
└── ...
```

## Requisitos

- Node.js 18+
- npm 9+
- Rust (para compilar Tauri)
- C++ Build Tools (para compilar dependencias nativas)

## Instalación

```bash
git clone https://github.com/gabrlrond2008-cmyk/NewSkeleton.git
cd NewSkeleton
npm install
```

Esto instala las dependencias de los workspaces `scratch-gui`, `scratch-vm` y la raíz.

## Scripts disponibles

### Desarrollo

```bash
# Iniciar el frontend con webpack-dev-server (puerto 8601)
npm run start -w scratch-gui

# Iniciar el backend
node backend/server.js
```

### Producción (Tauri)

```bash
npm run build -w scratch-gui
npm run tauri build
```

## Personalización de paquetes

Los paquetes personalizados (`scratch-gui` y `scratch-vm`) se encuentran como workspaces locales. No se publican a npm; se editan directamente en sus respectivos directorios.

### scratch-gui

Contiene la interfaz de Scratch con:

- Asistente IA integrado (pestaña AI + menú contextual)
- 20+ dispositivos físicos (stbBoard, Arduino, ESP32, etc.)
- Pestaña de circuitos (simulación visual)
- Pestaña 3D
- Pestaña de simulación
- Modos de viaje en el tiempo (Normal, Caturday, Old Timey, Nineties, Prehistoric)
- Temas Oscuro y Claro
- Editor de bloques con búsqueda
- Depurador visual

Para reconstruir después de cambios:

```bash
npm run build -w scratch-gui
```

O en modo desarrollo:

```bash
npm run start -w scratch-gui
```

### scratch-vm

Contiene el motor de Scratch con:

- Extensiones para dispositivos físicos (GPIO, PWM, I2C, SPI, UART)
- Generador de código EVM para dispositivos
- Modos de programación extendidos
- Soporte para nuevos bloques de hardware

Para reconstruir:

```bash
npm run build -w scratch-vm
```

### src-tauri

Aplicación de escritorio construida con Tauri. Requiere Rust instalado.

```bash
npm run tauri dev      # Desarrollo
npm run tauri build    # Producción
```

### backend

Servidor Node.js para funcionalidades auxiliares (ej: comunicación con APIs externas, servicio IA).

```bash
node backend/server.js
```

## Dependencias npm personalizadas

Este proyecto usa **workspaces de npm**. Los paquetes `scratch-gui` y `scratch-vm` son locales (`file:`), no versiones publicadas. Para actualizar dependencias de terceros, edita el `package.json` de cada workspace y ejecuta `npm install` desde la raíz.

## Notas

- El formato de guardado de proyectos usa extensión `.flynt`.
- Solo hay traducciones completas para inglés y español (EN/ES).
- El asistente IA responde preguntas y puede *leer* el workspace, pero su capacidad de *crear/modificar* bloques está en desarrollo.
