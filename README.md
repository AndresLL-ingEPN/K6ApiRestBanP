# Pruebas de Rendimiento - K6 | Banco BP
### API REST - Login

---

## Tecnologías y Versiones

| Tecnología | Versión | Descripción |
|---|---|---|
| **k6** | `v0.56.0` | Binario incluido (`k6.exe`, Windows x64), compilado con go1.23.6 |
| **xk6-read** | `v1.0.0` | Extensión xk6 integrada en el binario (`k6/x/read`) |
| **xk6-file** | `v1.4.2` | Extensión xk6 integrada en el binario (`k6/x/file`) |
| **xk6-faker** | `v0.4.1` | Extensión xk6 integrada en el binario (`k6/x/faker`) |
| **xk6-sql** | `v1.0.1` | Extensión xk6 integrada en el binario (`k6/x/sql`) |
| **k6-reporter** | `2.4.0` | Librería local — generación de reporte HTML |
| **k6-summary** | `0.0.1` | Librería local — salida JUnit XML y texto |
| **k6-utils** | `1.4.0` | Librería local — utilidades (`randomIntBetween`, etc.) |
| **papaparse** | `5.1.1` | Librería local — parseo de archivos CSV |

> **Sistema operativo soportado:** Windows 10/11 (64 bits)

---

## Estructura del Proyecto

```
k6BancoBp/
├── k6.exe                                      ← binario k6 listo para usar
├── .gitignore
├── README.md
├── README.txt
├── libs/                                       ← librerías locales (no requieren instalación)
│   ├── k6-reporter/2.4.0/bundle.js
│   ├── k6-summary/0.0.1/index.js
│   ├── k6-utils/1.4.0/index.js
│   └── papaparse/5.1.1/index.js
├── performanceTest/
│   └── rest-api-request/
│       ├── rest-login.js                       ← script principal de la prueba
│       ├── data/
│       │   └── test-data.csv                   ← datos de usuarios (username/password)
│       └── reports/                            ← carpeta de reportes generados
└── utils/
    ├── getDataFromCsvFile.js                   ← utilidad para leer CSV con SharedArray
    └── generate-reports/
        └── summaryConfig.js                    ← configuración de reportes HTML/JUnit/JSON
```

---

## Pre-requisitos

1. Sistema operativo **Windows 10/11 de 64 bits**.
2. **No** se requiere instalar Node.js ni dependencias de npm.
3. **No** se requiere instalar k6 por separado — el archivo `k6.exe` ya está incluido en la raíz del proyecto.
4. Conexión a internet activa durante la ejecución (la API bajo prueba es `https://fakestoreapi.com`).
5. **PowerShell** o **CMD** disponibles en el sistema.

---

## Pasos de Ejecución

### Paso 1 — Clonar o descargar el repositorio

**Opción A — Git:**
```powershell
git clone https://github.com/AndresLL-ingEPN/K6ApiRestBanP.git
cd K6ApiRestBanP
```

**Opción B — Descarga manual:**
Descargar el ZIP desde GitHub, descomprimir y abrir PowerShell en la carpeta:
```powershell
cd C:\ruta\hacia\k6BancoBp
```

---

### Paso 2 — Verificar el binario k6

Desde la **raíz del proyecto**, ejecutar:
```powershell
.\k6.exe version
```

Salida esperada:
```
k6.exe v0.56.0 (go1.23.6, windows/amd64)
```

> Si aparece "no se reconoce como comando", asegurarse de estar en la raíz del proyecto donde se encuentra `k6.exe`.

---

### Paso 3 — Revisar los datos de prueba

El archivo de datos se encuentra en:
```
performanceTest\rest-api-request\data\test-data.csv
```

Formato del CSV (siempre debe tener encabezado):
```csv
username,password
donero,ewedon
kevinryan,kev02937@
derek,jklg*_56
mor_2314,83r5^_
```

> Se pueden agregar o modificar usuarios según el ambiente a probar. Mantener siempre la primera fila como encabezado `username,password`.

---

### Paso 4 — Ejecutar la prueba de rendimiento

Desde la **raíz del proyecto** (donde está `k6.exe`), ejecutar:
```powershell
.\k6.exe run performanceTest\rest-api-request\rest-login.js
```

> **IMPORTANTE:** Ejecutar siempre desde la raíz del proyecto para que las rutas relativas a `/libs`, `/utils` y `/data` resuelvan correctamente.

---

### Paso 5 — Entender la configuración de la prueba

La prueba usa el executor **`ramping-arrival-rate`**:

| Etapa | Descripción | Duración |
|---|---|---|
| Rampa de subida | 0 → 20 req/s | 30 segundos |
| Carga sostenida | 20 req/s constante | 1 minuto |
| Rampa de bajada | 20 → 0 req/s | 20 segundos |

- **VUs pre-asignados:** 50
- **VUs máximos:** 100
- **Duración total aprox.:** ~1 minuto 50 segundos

**Umbrales (thresholds) definidos:**
| Métrica | Umbral |
|---|---|
| `http_req_duration` | Percentil 95 < **1500 ms** |
| `http_req_failed` | Tasa de errores < **3 %** |

> Si algún umbral se supera, k6 finaliza con **código de salida 99** e indica en consola qué threshold fue violado.

---

### Paso 6 — Revisar los reportes generados

Al finalizar la ejecución se generan automáticamente los siguientes archivos en la **raíz del proyecto**:

| Archivo | Descripción |
|---|---|
| `resultado_k6.json` | Datos completos en JSON — útil para CI/CD |
| `reporte_k6.html` | Reporte visual interactivo (k6-reporter 2.4.0) — abrir en Chrome/Edge/Firefox |
| `reporte_junit.xml` | Reporte JUnit para Jenkins, Azure DevOps o GitHub Actions |
| Salida en consola | Métricas en tiempo real: RPS, latencia, VUs activos, errores |

---

### Paso 7 — Interpretar resultados en consola

Métricas clave a observar:

```
http_req_duration .... Latencia de peticiones HTTP
  avg=XXXms            Promedio
  p(90)=XXXms          Percentil 90
  p(95)=XXXms          Percentil 95  ← umbral definido < 1500ms

http_req_failed ...... Tasa de peticiones fallidas  ← umbral < 3%
http_reqs ............ Total de peticiones realizadas
vus .................. VUs activos al finalizar
iterations ........... Total de iteraciones completadas
```

Resultado exitoso (todos los thresholds pasados):
```
✓ http_req_duration  p(95) < 1500ms
✓ http_req_failed    rate  < 3%
```

---

## Opciones Avanzadas de Ejecución

Sobrescribir VUs y duración (modo simple, sin scenarios):
```powershell
.\k6.exe run --vus 10 --duration 30s performanceTest\rest-api-request\rest-login.js
```

Guardar logs en un archivo:
```powershell
.\k6.exe run --console-output=logs.txt performanceTest\rest-api-request\rest-login.js
```

Pasar variables de entorno personalizadas (ej. cambiar `base_url`):
```powershell
.\k6.exe run -e BASE_URL=https://otro-ambiente.com performanceTest\rest-api-request\rest-login.js
```
> Requiere adaptar el script para leer la variable con `__ENV.BASE_URL`.

Ver ayuda completa:
```powershell
.\k6.exe help
.\k6.exe run --help
```

---

## Solución de Problemas Comunes

| Problema | Solución |
|---|---|
| `k6.exe no se reconoce como un comando` | Ejecutar desde la raíz del proyecto con el prefijo `.\` → `.\k6.exe run ...` |
| `cannot open test-data.csv: no such file` | Ejecutar desde la raíz del proyecto, no desde dentro de `performanceTest\rest-api-request\` |
| Thresholds fallan (código salida 99) | Verificar conectividad con `fakestoreapi.com`; comprobar usuarios en `test-data.csv`; reducir la carga en las etapas del script |
| Reporte HTML no abre correctamente | Abrir `reporte_k6.html` con Chrome o Edge; verificar que la prueba haya finalizado correctamente |

---

## Repositorio

- **GitHub:** https://github.com/AndresLL-ingEPN/K6ApiRestBanP
- **Rama principal:** `main`
