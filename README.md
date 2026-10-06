# 🗺️ Geo Búsquedas — Desafío API REST + Algolia + Mapbox

API REST para gestionar comercios con geodata (latitud/longitud) y buscar los más cercanos a un punto geográfico usando **Algolia** como motor de geobúsqueda, con un frontend interactivo en **Mapbox**.

---

## 📋 Tabla de contenidos

- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Frontend](#-frontend)
- [Ejemplos de uso](#-ejemplos-de-uso)
- [Decisiones de diseño](#-decisiones-de-diseño)

---

## 🏗️ Arquitectura

El proyecto sigue el patrón de **polyglot persistence**, separando la **fuente de verdad** del **motor de búsqueda geoespacial**:

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Frontend    │────────▶│   API REST       │────────▶│   lowdb      │
│  (Mapbox)    │         │   (Express)      │         │  (JSON)      │
└──────────────┘         └──────────────────┘         └──────────────┘
       │                          │
       │                          ▼
       │                 ┌──────────────────┐
       │                 │    Algolia       │
       └────────────────▶│  (geobúsqueda)   │
                         └──────────────────┘
```

**Flujo de una geobúsqueda (`/comercios-cerca-de`):**

1. El frontend hace *geocoding* con **Mapbox** para convertir una dirección en coordenadas.
2. Se llama al endpoint `/comercios-cerca-de?lat&lng`.
3. La API consulta **Algolia** con `aroundLatLng` y `aroundRadius`.
4. Algolia devuelve los `objectID`s de los comercios cercanos.
5. La API busca esos IDs en **lowdb** para obtener la data completa.
6. Se devuelve el resultado al frontend.

---

## 🛠️ Tecnologías

| Capa | Tecnología | Rol |
|---|---|---|
| Backend | Node.js + Express | Servidor API REST |
| Base de datos | **lowdb** | Persistencia en JSON (fuente de verdad) |
| Búsqueda geoespacial | **Algolia** | Índice optimizado para geobúsquedas |
| Frontend | HTML + JS + **Mapbox GL** | Mapa interactivo + buscador |
| Geocoding | **Mapbox Geocoding API** | Dirección → coordenadas |

---

## 🚀 Instalación

### Requisitos previos

- **Node.js** v18 o superior
- **npm** o **pnpm**
- Cuenta gratuita en **Algolia** → https://www.algolia.com/users/sign_up
- Cuenta gratuita en **Mapbox** → https://account.mapbox.com/auth/signup/

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd geo-busquedas

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno (ver sección siguiente)
nano .env

# 4. Arrancar el servidor
npm start
```

El servidor queda escuchando en `http://localhost:3000`.

---

## ⚙️ Configuración

### Variables de entorno (`.env`)

Crear un archivo `.env` en la carpeta `backend/` con:

```env
ALGOLIA_APP_ID=tu_app_id_de_algolia
ALGOLIA_ADMIN_KEY=tu_admin_api_key_de_algolia
PORT=3000
```

**Cómo obtener las credenciales:**

1. Ingresar a https://dashboard.algolia.com/account/api-keys
2. Copiar `Application ID` → `ALGOLIA_APP_ID`
3. Copiar `Admin API Key` (la de **escribir**, no la de buscar) → `ALGOLIA_ADMIN_KEY`
4. Crear un índice llamado **`comercios`** en Algolia

### Token de Mapbox

En `frontend/index.html`, reemplazar:

```javascript
const MAPBOX_TOKEN = 'tu_token_publico_aqui';
```

El token público se obtiene en: https://account.mapbox.com/access-tokens/

---

## 🌐 Endpoints de la API

Base URL: `http://localhost:3000`

### `POST /comercios`

Crea un nuevo comercio.

**Body:**
```json
{
  "nombre": "Bar La Bolsa",
  "categoria": "bar",
  "direccion": "Córdoba 1234",
  "lat": -32.9476,
  "lng": -60.6300
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "nombre": "Bar La Bolsa",
  "categoria": "bar",
  "direccion": "Córdoba 1234",
  "lat": -32.9476,
  "lng": -60.63
}
```

---

### `GET /comercios`

Lista todos los comercios.

**Respuesta (200):** array de comercios.

---

### `GET /comercios/:id`

Devuelve un comercio por ID.

**Respuesta (200):** objeto comercio.
**Respuesta (404):** `{ "error": "No encontrado" }`

---

### `PUT /comercios/:id`

Actualiza un comercio existente.

**Body:** mismo formato que `POST`.
**Respuesta (200):** comercio actualizado.
**Respuesta (404):** si no existe.

---

### `GET /comercios-cerca-de?lat&lng&radio`

🎯 **Endpoint principal del desafío.** Devuelve los comercios dentro de un radio geográfico alrededor de un punto.

**Query params:**

| Param | Tipo | Descripción | Default |
|---|---|---|---|
| `lat` | number | Latitud del punto central | *requerido* |
| `lng` | number | Longitud del punto central | *requerido* |
| `radio` | number | Radio en metros | `1000` |

**Ejemplo:**
```
GET /comercios-cerca-de?lat=-32.9476&lng=-60.6300&radio=2000
```

**Respuesta (200):** array de comercios dentro del radio.

---

## 🗺️ Frontend

El frontend es un único archivo `frontend/index.html` que incluye:

- **Mapa interactivo** con Mapbox GL JS
- **Buscador de lugares** con geocoding de Mapbox
- **Marcador rojo** para el lugar buscado
- **Marcadores azules** para los comercios cercanos
- **Listado** de comercios con nombre, categoría y dirección

### Cómo usarlo

1. Con la API corriendo en `http://localhost:3000`
2. Abrir `frontend/index.html` en el navegador (doble clic)
3. Escribir un lugar (ej: `Córdoba 1234 Rosario`) y presionar **Buscar**
4. Ver los comercios cercanos en el mapa

---

## 🧪 Ejemplos de uso

### Crear un comercio

```bash
curl -X POST http://localhost:3000/comercios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Bar La Bolsa",
    "categoria": "bar",
    "direccion": "Córdoba 1234",
    "lat": -32.9476,
    "lng": -60.6300
  }'
```

### Listar todos

```bash
curl http://localhost:3000/comercios
```

### Buscar cerca de un punto

```bash
curl "http://localhost:3000/comercios-cerca-de?lat=-32.9476&lng=-60.6300&radio=2000"
```

### Actualizar un comercio

```bash
curl -X PUT http://localhost:3000/comercios/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Bar La Bolsa (renovado)",
    "categoria": "bar",
    "direccion": "Córdoba 1234",
    "lat": -32.9476,
    "lng": -60.6300
  }'
```

---

## 🎨 Decisiones de diseño

### ¿Por qué Algolia y no Postgres con PostGIS?

Aunque Postgres con PostGIS puede hacer geobúsquedas, **Algolia** ofrece:

- **Geobúsqueda nativa** con `aroundLatLng` y `aroundRadius`
- **Tolerancia a errores de tipeo**
- **Búsqueda por texto libre** en todos los campos
- **Latencia ultrabaja** (CDN global)
- **Sin necesidad de cálculos manuales** (Haversine, índices R-tree, etc.)

### ¿Por qué lowdb y no SQLite?

El proyecto originalmente usaba **`better-sqlite3`**, pero requiere compilación nativa con **node-gyp + Python + Visual Studio Build Tools**, lo cual es frágil en Windows.

**`lowdb`** es una base de datos **100% JavaScript**, sin compilación, que persiste en un archivo JSON. Ideal para:

- Prototipos y desafíos académicos
- Entornos Windows sin toolchain de C++
- Proyectos donde la performance no es crítica

El patrón de **polyglot persistence** se mantiene: `lowdb` es la fuente de verdad, `Algolia` es el motor de búsqueda.

---

## 👤 Autor

**Emanuel** — Desafío de Geo Búsquedas

---

## 📝 Licencia

MIT