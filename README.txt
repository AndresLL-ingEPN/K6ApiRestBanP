================================================================================
  PROYECTO DE PRUEBAS DE RENDIMIENTO - K6 | BANCO BP
  API REST - Login
================================================================================

TECNOLOGÍAS Y VERSIONES
--------------------------------------------------------------------------------
  - k6                  v0.56.0  (binario incluido: k6.exe, Windows x64)
    Compilado con:       go1.23.6 / windows/amd64

  Extensiones xk6 integradas en el binario:
  - xk6-read            v1.0.0   (k6/x/read)
  - xk6-file            v1.4.2   (k6/x/file)
  - xk6-faker           v0.4.1   (k6/x/faker)
  - xk6-sql             v1.0.1   (k6/x/sql)

  Librerías locales (carpeta /libs):
  - k6-reporter         2.4.0    (generación de reporte HTML)
  - k6-summary          0.0.1    (salida JUnit XML y texto)
  - k6-utils            1.4.0    (utilidades: randomIntBetween, etc.)
  - papaparse           5.1.1    (parseo de archivos CSV)

  Sistema operativo soportado:
  - Windows 10/11 (64 bits)

--------------------------------------------------------------------------------
ESTRUCTURA DEL PROYECTO
--------------------------------------------------------------------------------
  k6BancoBp/
  ├── k6.exe                                      <- binario k6 listo para usar
  ├── .gitignore
  ├── README.txt                                  <- este archivo
  ├── libs/                                       <- librerías locales (no instalar)
  │   ├── k6-reporter/2.4.0/bundle.js
  │   ├── k6-summary/0.0.1/index.js
  │   ├── k6-utils/1.4.0/index.js
  │   └── papaparse/5.1.1/index.js
  ├── performanceTest/
  │   └── rest-api-request/
  │       ├── rest-login.js                       <- script principal de la prueba
  │       ├── data/
  │       │   └── test-data.csv                   <- datos de usuarios (username/password)
  │       └── reports/                            <- carpeta donde se generan los reportes
  └── utils/
      ├── getDataFromCsvFile.js                   <- utilidad para leer CSV con SharedArray
      └── generate-reports/
          └── summaryConfig.js                    <- configuración de reportes HTML/JUnit/JSON

--------------------------------------------------------------------------------
PRE-REQUISITOS
--------------------------------------------------------------------------------
  1. Sistema operativo Windows 10/11 de 64 bits.
  2. NO se requiere instalar Node.js ni ninguna dependencia de npm.
  3. NO se requiere instalar k6 por separado; el archivo k6.exe ya está incluido
     en la raíz del proyecto.
  4. Conexión a internet activa durante la ejecución (la API bajo prueba es
     https://fakestoreapi.com).
  5. PowerShell o CMD disponibles en el sistema.

--------------------------------------------------------------------------------
PASOS DE EJECUCIÓN
--------------------------------------------------------------------------------

** PASO 1 — Clonar o descargar el repositorio **

  Opción A (Git):
    git clone https://github.com/AndresLL-ingEPN/K6ApiRestBanP.git
    cd K6ApiRestBanP

  Opción B (descarga manual):
    Descargar el ZIP desde GitHub y descomprimir.
    Abrir PowerShell y navegar a la carpeta descomprimida:
      cd C:\ruta\hacia\k6BancoBp

----------------------------------------
** PASO 2 — Verificar el binario k6 **

  Desde la raíz del proyecto, ejecutar:

    .\k6.exe version

  Salida esperada:
    k6.exe v0.56.0 (go1.23.6, windows/amd64)

  Si aparece "no se reconoce como comando", asegurarse de estar en la raíz
  del proyecto donde se encuentra k6.exe.

----------------------------------------
** PASO 3 — Revisar los datos de prueba **

  El archivo de datos se encuentra en:
    performanceTest\rest-api-request\data\test-data.csv

  Formato del CSV (debe tener encabezado):
    username,password
    donero,ewedon
    kevinryan,kev02937@
    ...

  Se pueden agregar o modificar usuarios según el ambiente a probar.
  Mantener siempre la primera fila como encabezado (username,password).

----------------------------------------
** PASO 4 — Ejecutar la prueba de rendimiento **

  Desde la RAÍZ del proyecto (donde está k6.exe), ejecutar:

    .\k6.exe run performanceTest\rest-api-request\rest-login.js

  IMPORTANTE: Ejecutar siempre desde la raíz del proyecto para que las
  rutas relativas a /libs, /utils y /data resuelvan correctamente.

----------------------------------------
** PASO 5 — Entender la configuración de la prueba **

  La prueba usa el executor "ramping-arrival-rate":

    Etapa 1: Rampa de subida  — 0 → 20 req/s en 30 segundos
    Etapa 2: Carga sostenida  — 20 req/s durante 1 minuto
    Etapa 3: Rampa de bajada  — 20 → 0 req/s en 20 segundos

  VUs preAsignados : 50
  VUs máximos      : 100
  Duración total aprox.: ~1 minuto 50 segundos

  Umbrales (thresholds) definidos:
    - http_req_duration : el percentil 95 debe ser < 1500 ms
    - http_req_failed   : la tasa de errores debe ser < 3 %

  Si algún umbral se supera, k6 finaliza con código de salida 99
  (fallo de umbral) e indica en consola qué threshold fue violado.

----------------------------------------
** PASO 6 — Revisar los reportes generados **

  Al finalizar la ejecución se generan automáticamente los siguientes archivos
  en la RAÍZ del proyecto:

  a) resultado_k6.json
       Datos completos de la prueba en formato JSON.
       Útil para integración con pipelines CI/CD.

  b) reporte_k6.html
       Reporte visual interactivo generado con k6-reporter 2.4.0.
       Abrir con cualquier navegador (Chrome, Edge, Firefox).

  c) reporte_junit.xml
       Reporte en formato JUnit para integración con herramientas como
       Jenkins, Azure DevOps o GitHub Actions.

  d) Salida estándar en consola
       Métricas en tiempo real: RPS, latencia, VUs activos, errores, etc.

----------------------------------------
** PASO 7 — Interpretar resultados en consola **

  Métricas clave a observar:

    http_req_duration .... Latencia de peticiones HTTP
      avg=XXXms          Promedio
      p(90)=XXXms        Percentil 90
      p(95)=XXXms        Percentil 95  ← umbral definido < 1500ms

    http_req_failed ...... Tasa de peticiones fallidas ← umbral < 3%
    http_reqs ............ Total de peticiones realizadas
    vus .................. VUs activos al finalizar
    iterations ........... Total de iteraciones completadas

  Resultado exitoso (todos los thresholds pasados):
    ✓ http_req_duration  p(95) < 1500ms
    ✓ http_req_failed    rate  < 3%

--------------------------------------------------------------------------------
OPCIONES AVANZADAS DE EJECUCIÓN
--------------------------------------------------------------------------------

  Sobrescribir número de VUs y duración (modo simple, sin scenarios):
    .\k6.exe run --vus 10 --duration 30s performanceTest\rest-api-request\rest-login.js

  Ejecutar con salida de logs detallada:
    .\k6.exe run --console-output=logs.txt performanceTest\rest-api-request\rest-login.js

  Ejecutar con variable de entorno personalizada (ej. cambiar base_url):
    .\k6.exe run -e BASE_URL=https://otro-ambiente.com performanceTest\rest-api-request\rest-login.js
    (requiere adaptar el script para leer la variable con: __ENV.BASE_URL)

  Ver ayuda completa de k6:
    .\k6.exe help
    .\k6.exe run --help

--------------------------------------------------------------------------------
SOLUCIÓN DE PROBLEMAS COMUNES
--------------------------------------------------------------------------------

  PROBLEMA: "k6.exe no se reconoce como un comando"
  SOLUCIÓN : Asegurarse de ejecutar desde la raíz del proyecto (donde está k6.exe).
             Usar siempre el prefijo .\  →  .\k6.exe run ...

  PROBLEMA: "cannot open ... test-data.csv: no such file or directory"
  SOLUCIÓN : Ejecutar desde la raíz del proyecto, no desde dentro de
             performanceTest\rest-api-request\.

  PROBLEMA: Los thresholds fallan (código de salida 99)
  SOLUCIÓN : Revisar conectividad con https://fakestoreapi.com.
             Verificar que los usuarios en test-data.csv sean válidos.
             Reducir la carga en las etapas del script si el ambiente
             no soporta la cantidad de RPS configurada.

  PROBLEMA: El reporte HTML no abre correctamente
  SOLUCIÓN : Abrir reporte_k6.html con un navegador moderno (Chrome/Edge).
             Asegurarse de que el archivo no esté vacío (la prueba debe
             haber finalizado correctamente).

--------------------------------------------------------------------------------
REPOSITORIO
--------------------------------------------------------------------------------
  GitHub : https://github.com/AndresLL-ingEPN/K6ApiRestBanP
  Rama   : main

================================================================================
