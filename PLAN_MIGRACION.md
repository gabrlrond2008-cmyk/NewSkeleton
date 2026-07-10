# PLAN DE MIGRACIÓN: stblock-desktop → NewSkeleton (Tauri + scratch-vm)

## Estado Actual (Análisis Completo)

### NewSkeleton (Destino)
- **Framework:** Tauri 2 + React 16 + Redux 3
- **VM:** scratch-vm (MIT vanilla) — **NO** openblock-vm
- **GUI:** scratch-gui fork con AI Tab + Schema Tab + Device Selector
- **Backend:** Express simple (no usado para Arduino)
- **Node.js requerido:** 18.20.7 (actual: 24.18.0)
- **VM Corre en:** Hilo principal (NO Web Worker, NO iframe)

### Device Selector (Estado Actual)
```
MenuBar "Select device" → onClick → Redux openDeviceLibrary()
  → DeviceSelector modal (20 tarjetas)
  → onClick tarjeta → setSelectedDevice(useState LOCAL)
  → MenuBar muestra nombre, Watermark muestra icono
  ─── FIN. NO llama al VM, NO carga nada ───
```

### stblock-desktop (Origen - Código en migracion-stblock/)
- openblock-vm con sistema `devices/`
- `getInfo()` retorna ARRAY de categorías
- Code generators separados (JavaScript → C++)
- Serial I/O via openblock-link
- Arduino CLI para compile/upload
- 78 archivos extraídos en migracion-stblock/

---

## FASE 0: Setup + Dependencias

### Node.js
```bash
# Instalar nvm-windows (https://github.com/coreybutler/nvm-windows)
nvm install 18.20.7
nvm use 18.20.7
node --version  # Debe mostrar v18.20.7
```

### Arduino CLI
```bash
# Opción 1: winget
winget install Arduino.ArduinoCLI

# Opción 2: Chocolatey
choco install arduino-cli

# Opción 3: Manual
# Descargar de https://arduino.github.io/arduino-cli/installation/

# Verificar
arduino-cli version

# Instalar cores
arduino-cli core update-index
arduino-cli core install arduino:avr
```

### Rust (ya instalado v1.96.1)
```bash
rustup target add x86_64-pc-windows-msvc
```

### npm Dependencies
```bash
cd C:\Users\Gabrl\Desktop\NewSkeleton
npm install --legacy-peer-deps
```

### CH340 Driver (para clones Arduino)
Descargar: https://www.wch.cn/download/CH341SER_EXE.html

---

## FASE 1: Redux Device State

**Objetivo:** Migrar device selection de `useState` local a Redux.

### Archivos a modificar:

#### 1.1 Crear `scratch-gui/src/reducers/device.js`
```js
const SET_SELECTED_DEVICE = 'scratch-gui/device/SET_SELECTED_DEVICE';
const SET_DEVICE_LOADING = 'scratch-gui/device/SET_DEVICE_LOADING';
const SET_DEVICE_ERROR = 'scratch-gui/device/SET_DEVICE_ERROR';

const initialState = {
    selectedDevice: null,
    deviceLoading: false,
    deviceError: null
};

export default function deviceReducer(state = initialState, action) {
    switch (action.type) {
    case SET_SELECTED_DEVICE:
        return {...state, selectedDevice: action.device, deviceError: null};
    case SET_DEVICE_LOADING:
        return {...state, deviceLoading: action.loading};
    case SET_DEVICE_ERROR:
        return {...state, deviceError: action.error, deviceLoading: false};
    default:
        return state;
    }
}

export const setSelectedDevice = device => ({type: SET_SELECTED_DEVICE, device});
export const clearSelectedDevice = () => ({type: SET_SELECTED_DEVICE, device: null});
export const setDeviceLoading = loading => ({type: SET_DEVICE_LOADING, loading});
export const setDeviceError = error => ({type: SET_DEVICE_ERROR, error});
```

#### 1.2 Modificar `scratch-gui/src/reducers/gui.js`
Agregar `deviceReducer` al `combineReducers` y al `guiInitialState`.

#### 1.3 Modificar `scratch-gui/src/components/gui/gui.jsx`
- Eliminar `useState` de `selectedDevice`
- Leer `selectedDevice` de Redux via `mapStateToProps`
- En `onDeviceSelected`, dispatchear `setSelectedDevice(device)` y llamar al VM

#### 1.4 Modificar `scratch-gui/src/components/menu-bar/menu-bar.jsx`
- Agregar `selectedDevice` a `mapStateToProps` de Redux (en lugar de recibirlo como prop)

#### 1.5 Modificar `scratch-gui/src/containers/watermark.jsx`
- Leer `selectedDevice` de Redux directamente

---

## FASE 2: EVM Device System (scratch-vm)

**Objetivo:** Crear sistema que permita a scratch-vm cargar dispositivos con MÚLTIPLES categorías.

### Arquitectura

```
vm.evmDeviceManager
├── loadDevice(deviceId)        → Promise<void>
├── clearDevice()               → void
├── registerCategory(info)      → registra 1 categoría en Runtime
├── unregisterAllCategories()   → limpia categorías del device anterior
├── getCurrentDevice()          → { deviceId, instance }
└── codeGenerator               → EVMCodeGenerator
```

### Archivos a crear:

#### 2.1 `scratch-vm/src/engine/evm-device-manager.js`
```js
class EVMDeviceManager {
    constructor(runtime) {
        this.runtime = runtime;
        this._currentDevice = null;
    }

    loadDevice(deviceId) {
        if (this._currentDevice) this.clearDevice();

        const DeviceClass = EVMBuiltinDevices[deviceId];
        if (!DeviceClass) return Promise.reject(new Error(`Device not found: ${deviceId}`));

        const instance = new DeviceClass(this.runtime, deviceId);
        const categories = instance.getInfo(); // Array!

        categories.forEach(cat => {
            this.runtime.registerDeviceCategory(cat); // nuevo método público
        });

        this._currentDevice = {deviceId, instance};
        return Promise.resolve();
    }

    clearDevice() {
        if (!this._currentDevice) return;
        this.runtime.unregisterDeviceCategories();
        this._currentDevice = null;
    }
}
```

#### 2.2 `scratch-vm/src/engine/evm-code-generator.js`
```js
class EVMCodeGenerator {
    constructor() {
        this._generators = {};
    }

    register(opcode, fn) {
        this._generators[opcode] = fn;
    }

    generate(blocks, deviceId) {
        let code = `// Generated for ${deviceId}\n`;
        blocks.forEach(b => {
            const gen = this._generators[b.opcode];
            if (gen) code += gen(b, this) + '\n';
        });
        return code;
    }
}
```

#### 2.3 `scratch-vm/src/devices/index.js`
```js
import ArduinoUno from './arduinoUno';
import ArduinoMega2560 from './arduinoMega2560';
import STBoardExtension from './stBoardExtension';
import STBoardV2 from './stbBoardV2';

export const EVMBuiltinDevices = {
    arduinoUno: ArduinoUno,
    arduinoMega2560: ArduinoMega2560,
    stBoardExtension: STBoardExtension,
    stbBoardV2: STBoardV2
};
```

### Archivos a modificar:

#### 2.4 `scratch-vm/src/engine/runtime.js`
Agregar métodos públicos:
- `registerDeviceCategory(categoryInfo)` — registra 1 categoría trackeada como "device category"
- `unregisterDeviceCategories()` — remueve todas las device categories del `_blockInfo`

#### 2.5 `scratch-vm/src/index.js`
Exportar `EVMDeviceManager` y `EVMBuiltinDevices`

---

## FASE 3: Menu Bar + Botón "Download"

**Objetivo:** Agregar botón "Download" al lado del device selector en el menú.

### 3.1 Modificar `scratch-gui/src/components/menu-bar/menu-bar.jsx`

Agregar después del device selector (línea ~409):
```jsx
{this.props.selectedDevice && (
    <div
        className={classNames(styles.menuBarItem, styles.hoverable)}
        onMouseUp={this.handleDownloadCode}
    >
        <span>Download</span>
    </div>
)}
```

### 3.2 Handler `handleDownloadCode`
```js
async handleDownloadCode() {
    const device = this.props.selectedDevice;
    if (!device) return;

    try {
        const blocks = this.props.vm.runtime.getBlocksForDevice();
        const code = this.props.vm.evmDeviceManager.codeGenerator
            .generate(blocks, device.deviceId);

        const blob = new Blob([code], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.props.projectTitle || 'sketch'}.ino`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Download failed:', e);
    }
}
```

### 3.3 Opción: Compilar y descargar .hex
```js
async handleDownloadHex(code, device) {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('compile_arduino', {
            source: code,
            fqbn: device.fqbn
        });
        // Descargar .hex resultante
    } catch (e) {
        console.error('Compilation failed:', e);
    }
}
```

---

## FASE 4: Device Ports

**Objetivo:** Portar las definiciones de tarjetas desde `migracion-stblock/` a `scratch-vm/src/devices/`.

### Estructura destino:
```
scratch-vm/src/devices/
├── index.js                    ← exports EVMBuiltinDevices
├── peripheral.js               ← clase base para comunicación serial
├── arduinoUno/
│   └── index.js                ← definición + bloques
├── arduinoMega2560/
│   └── index.js                ← hereda Uno + serial1-3
├── stBoardExtension/
│   └── index.js                ← hereda Uno + categoría Motores
└── stbBoardV2/
    └── index.js                ← hereda Mega2560 + 14 categorías
```

### Formato de cada device:
```js
class ArduinoUnoDevice {
    get DEVICE_ID() { return 'arduinoUno'; }

    constructor(runtime, originalDeviceId) {
        this.runtime = runtime;
    }

    getInfo() {
        return [
            {
                id: 'arduino_pines',
                name: 'Pines',
                color1: '#4C97FF',
                color2: '#4280D7',
                color3: '#3373CC',
                blocks: [ /* Blockly block definitions */ ],
                menus: { /* dropdown menus */ }
            },
            // más categorías...
        ];
    }

    // Block implementations (modo realtime, si se implementa)
    digitalWrite(args) { /* enviar comando serial */ }
    digitalRead(args) { return 0; }
}
```

### Herencia (como en openblock):
```js
class STBoardExtensionDevice extends ArduinoUnoDevice {
    getInfo() {
        const unoCats = super.getInfo();
        const stbCats = [{
            id: 'motores',
            name: 'Motores',
            color1: '#1f7a4b',
            blocks: [ /* ~40 bloques de motores STB */ ],
            menus: { STB_MOTOR_TYPE_MENU: [...] }
        }];
        return [...unoCats, ...stbCats];
    }
}
```

---

## FASE 5: Code Generators

**Objetivo:** Portar generadores C++ desde `migracion-stblock/generators/` a `scratch-vm/src/generators/`.

### Archivos origen → destino:
```
migracion-stblock/
├── stboard-extension/generators/arduino_motores.js
│   → scratch-vm/src/generators/stBoardExtension.js
├── stboard-v2/generators/all_stbv2_generators.js
│   → scratch-vm/src/generators/stbBoardV2.js
├── stboard-v2/generators/all_stbv2_gyro_matrix_oled_generators.js
│   → scratch-vm/src/generators/stbBoardV2Extra.js
├── stboard-v2/generators/all_stbv2_helpers_and_generators.js
│   → scratch-vm/src/generators/stbBoardV2Helpers.js
├── stboard-v2/generators/stbv2_puertos.js
│   → scratch-vm/src/generators/stbBoardV2Ports.js
├── base-dependencies/arduinoUno.js (generators embebidos)
│   → scratch-vm/src/generators/arduinoUno.js
└── base-dependencies/arduinoMega2560.js (generators embebidos)
    → scratch-vm/src/generators/arduinoMega2560.js
```

### Formato de cada generador:
```js
// scratch-vm/src/generators/arduinoUno.js
export default {
    'digitalWrite': (block, gen) => {
        const pin = gen.valueToCode(block, 'PIN', 0);
        const value = gen.valueToCode(block, 'VALUE', 0);
        return `digitalWrite(${pin}, ${value});\n`;
    },
    'digitalRead': (block, gen) => {
        const pin = gen.valueToCode(block, 'PIN', 0);
        return `digitalRead(${pin})`;
    },
    // ... ~60 opcodes
};
```

---

## FASE 6: Serial I/O (Tauri Backend)

**Objetivo:** Comunicación serie entre la app y Arduino.

### Archivos:

#### 6.1 `scratch-vm/src/io/serial.js`
```js
class Serial {
    constructor(runtime) {
        this._runtime = runtime;
        this._port = null;
    }

    async open(portName, baudRate) {
        const { invoke } = window.__TAURI__;
        await invoke('serial_open', { port: portName, baudRate });
        this._port = portName;
    }

    async close() {
        if (!this._port) return;
        await window.__TAURI__.invoke('serial_close', { port: this._port });
        this._port = null;
    }

    async write(data) {
        return window.__TAURI__.invoke('serial_write', { port: this._port, data });
    }

    async read() {
        return window.__TAURI__.invoke('serial_read', { port: this._port });
    }

    static async listPorts() {
        return window.__TAURI__.invoke('serial_list_ports');
    }
}
```

#### 6.2 `src-tauri/src/commands/serial.rs`
```rust
use serialport;
use tauri::{command, State};
use std::sync::Mutex;
use std::time::Duration;

struct SerialState {
    port: Option<Box<dyn serialport::SerialPort>>,
}

#[command]
fn serial_list_ports() -> Result<Vec<String>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    Ok(ports.into_iter().map(|p| p.port_name).collect())
}

#[command]
fn serial_open(state: State<'_, Mutex<SerialState>>, port: String, baud_rate: u32) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;
    s.port = Some(serialport::new(&port, baud_rate)
        .timeout(Duration::from_millis(1000))
        .open()
        .map_err(|e| format!("Failed to open {}: {}", port, e))?);
    Ok(())
}

#[command]
fn serial_close(state: State<'_, Mutex<SerialState>>) -> Result<(), String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;
    s.port = None; // Drop closes the port
    Ok(())
}

#[command]
fn serial_write(state: State<'_, Mutex<SerialState>>, data: Vec<u8>) -> Result<usize, String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;
    s.port.as_mut()
        .ok_or("Port not open")?
        .write(&data)
        .map_err(|e| e.to_string())
}

#[command]
fn serial_read(state: State<'_, Mutex<SerialState>>) -> Result<Vec<u8>, String> {
    let mut s = state.lock().map_err(|e| e.to_string())?;
    let port = s.port.as_mut().ok_or("Port not open")?;
    let mut buf = vec![0u8; 1024];
    let n = port.read(&mut buf).map_err(|e| e.to_string())?;
    buf.truncate(n);
    Ok(buf)
}
```

#### 6.3 Modificar `src-tauri/Cargo.toml`
```toml
[dependencies]
serialport = "4.2"
```

#### 6.4 Modificar `src-tauri/src/main.rs`
```rust
mod commands;
use commands::serial::{serial_list_ports, serial_open, serial_close, serial_write, serial_read};

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(serial::SerialState { port: None }))
        .invoke_handler(tauri::generate_handler![
            serial_list_ports, serial_open, serial_close, serial_write, serial_read
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## FASE 7: Arduino CLI (Tauri Backend)

**Objetivo:** Compilar y subir sketches Arduino.

### Archivos:

#### 7.1 `src-tauri/src/commands/arduino.rs`
```rust
use tauri::command;
use std::path::PathBuf;
use tokio::process::Command;
use tempfile::TempDir;
use std::fs;

#[derive(serde::Serialize)]
pub struct CompileResult {
    pub success: bool,
    pub hex_path: Option<String>,
    pub errors: String,
}

#[derive(serde::Serialize)]
pub struct UploadResult {
    pub success: bool,
    pub errors: String,
}

#[command]
pub async fn compile_arduino(source: String, fqbn: String) -> Result<CompileResult, String> {
    let tmp_dir = TempDir::new().map_err(|e| e.to_string())?;
    let sketch_dir = tmp_dir.path().join("sketch");
    fs::create_dir_all(&sketch_dir).map_err(|e| e.to_string())?;

    // Crear .ino file
    fs::write(sketch_dir.join("sketch.ino"), &source).map_err(|e| e.to_string())?;

    // Ejecutar arduino-cli compile
    let output = Command::new("arduino-cli")
        .args(&["compile", "--fqbn", &fqbn, &sketch_dir.to_string_lossy()])
        .output()
        .await
        .map_err(|e| format!("arduino-cli not found: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let errors = format!("{}\n{}", stdout, stderr);

    if output.status.success() {
        // Buscar .hex
        let hex_path = sketch_dir.join("build").join(&fqbn.replace(":", ".")).join("sketch.ino.hex");
        Ok(CompileResult {
            success: true,
            hex_path: Some(hex_path.to_string_lossy().to_string()),
            errors,
        })
    } else {
        Ok(CompileResult {
            success: false,
            hex_path: None,
            errors,
        })
    }
}

#[command]
pub async fn upload_firmware(hex_path: String, port: String, fqbn: String) -> Result<UploadResult, String> {
    let output = Command::new("arduino-cli")
        .args(&["upload", "--fqbn", &fqbn, "--port", &port, &hex_path])
        .output()
        .await
        .map_err(|e| format!("Upload failed: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    Ok(UploadResult {
        success: output.status.success(),
        errors: format!("{}\n{}", stdout, stderr),
    })
}
```

#### 7.2 Modificar `Cargo.toml`
```toml
[dependencies]
tokio = { version = "1", features = ["process", "fs"] }
tempfile = "3"
```

---

## FASE 8: GUI Integration

**Objetivo:** Conectar device selector → VM, connection modal serial, upload progress.

### 8.1 Connection Modal for Serial
Modificar `scratch-gui/src/containers/connection-modal.jsx`:
```jsx
if (extensionId === 'serial') {
    return <SerialConnectionModal ... />;
}
// else: BLE flow existente
```

### 8.2 Serial Connection Component
```jsx
const SerialConnectionModal = ({ vm, onClose }) => {
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState(null);
    const [baudRate, setBaudRate] = useState(9600);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        Serial.listPorts().then(setPorts);
    }, []);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await vm.ioDevices.serial.open(selectedPort, baudRate);
            onClose();
        } catch (e) {
            alert('Connection failed: ' + e);
        }
        setConnecting(false);
    };

    return (
        <div>
            <h3>Select Serial Port</h3>
            <select onChange={e => setSelectedPort(e.target.value)}>
                {ports.map(p => <option key={p}>{p}</option>)}
            </select>
            <select onChange={e => setBaudRate(Number(e.target.value))}>
                {[9600, 57600, 115200].map(b => <option key={b}>{b}</option>)}
            </select>
            <button onClick={handleConnect} disabled={!selectedPort || connecting}>
                {connecting ? 'Connecting...' : 'Connect'}
            </button>
        </div>
    );
};
```

### 8.3 Upload Progress Modal
```jsx
const UploadProgress = ({ visible, device, code, onClose }) => {
    const [phase, setPhase] = useState('idle');
    const [error, setError] = useState(null);

    const handleUpload = async () => {
        setPhase('generating');
        // Code ya generado

        setPhase('compiling');
        try {
            const result = await invoke('compile_arduino', {
                source: code,
                fqbn: device.fqbn
            });
            if (!result.success) {
                setError(result.errors);
                setPhase('error');
                return;
            }

            setPhase('uploading');
            await invoke('upload_firmware', {
                hexPath: result.hex_path,
                port: device.connectedPort,
                fqbn: device.fqbn
            });

            setPhase('done');
        } catch (e) {
            setError(e.toString());
            setPhase('error');
        }
    };

    return (
        <Modal visible={visible}>
            <div>
                {phase === 'generating' && <p>Generating code...</p>}
                {phase === 'compiling' && <p>Compiling...</p>}
                {phase === 'uploading' && <p>Uploading...</p>}
                {phase === 'done' && <p>Upload complete!</p>}
                {phase === 'error' && <p>Error: {error}</p>}
                <button onClick={handleUpload}>Upload</button>
                <button onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
};
```

---

## FASE 9: Build + Test

### Verificaciones
```bash
# 1. Build scratch-vm
cd scratch-vm
npm run build

# 2. Build scratch-gui
cd ../scratch-gui
npm run build

# 3. Build Tauri app
cd ..
npm run tauri build
# o para desarrollo:
npm run tauri dev
```

### Test Plan
1. Seleccionar "STBoard V2" → ver 14 categorías en toolbox
2. Arrastrar bloques de Motores, Giroscopio, etc.
3. Click "Download" → descargar .ino
4. Conectar Arduino → seleccionar puerto COM
5. Click "Upload" → compilar → subir
6. Verificar que el Arduino ejecuta el programa

---

## Errores Probables y Soluciones

| # | Error | Causa | Solución |
|---|-------|-------|----------|
| 1 | `_registerExtensionPrimitives` privado | Runtime.js encapsula método | Crear `registerDeviceCategory()` público |
| 2 | Device categories no se limpian al cambiar | No hay cleanup | `unregisterDeviceCategories()` remueve del `_blockInfo` |
| 3 | Toolbox no se actualiza | Redux no notificado | Emitir `EVM_DEVICE_CHANGED` event + listener en GUI |
| 4 | Opcodes duplicados | STD y STB pueden tener mismos nombres | Prefijar con deviceId: `stbBoardV2_digitalWrite` |
| 5 | Node.js 24 incompatible con React 16 | Too new | Usar `nvm use 18.20.7` |
| 6 | `window.__TAURI__` undefined | VM en contexto no-Tauri | Usar Tauri invoke directamente (import) |
| 7 | arduino-cli no en PATH | No instalado | Buscar en `%LOCALAPPDATA%\Arduino15\` |
| 8 | Puerto serial bloqueado por otro programa | Windows | Cerrar IDE Arduino, monitor serial, etc. |
| 9 | npm install falla | dependencias rotas | `--legacy-peer-deps` |
| 10 | USB no detectado | Falta driver CH340 | Instalar CH341SER.EXE |

---

## Mapa de Archivos Completo

```
NUEVOS:
  scratch-vm/
  ├── src/engine/evm-device-manager.js
  ├── src/engine/evm-code-generator.js
  ├── src/io/serial.js
  ├── src/devices/index.js
  ├── src/devices/peripheral.js
  ├── src/devices/arduinoUno/index.js
  ├── src/devices/arduinoMega2560/index.js
  ├── src/devices/stBoardExtension/index.js
  ├── src/devices/stbBoardV2/index.js
  └── src/generators/*.js (6 archivos)

  scratch-gui/
  ├── src/reducers/device.js
  ├── src/reducers/upload.js
  ├── src/components/upload-progress/upload-progress.jsx
  ├── src/components/upload-progress/upload-progress.css
  └── src/components/connection-modal/serial-connection.jsx

  src-tauri/
  ├── src/commands/serial.rs
  └── src/commands/arduino.rs

MODIFICADOS:
  scratch-vm/
  ├── src/engine/runtime.js
  ├── src/extension-support/extension-manager.js
  └── src/index.js

  scratch-gui/
  ├── src/reducers/gui.js
  ├── src/reducers/modals.js
  ├── src/components/gui/gui.jsx
  ├── src/components/menu-bar/menu-bar.jsx
  ├── src/components/menu-bar/menu-bar.css
  ├── src/containers/gui.jsx
  ├── src/containers/watermark.jsx
  ├── src/containers/connection-modal.jsx
  ├── src/containers/blocks.jsx
  ├── src/lib/vm-manager-hoc.jsx
  ├── src/lib/vm-listener-hoc.jsx
  └── src/lib/make-toolbox-xml.js

  src-tauri/
  ├── Cargo.toml
  └── src/main.rs
```
