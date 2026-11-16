# Web3 Kuska

Aplicación web educativa para aprender a usar Web3 con Hedera (HCS) en ambiente **Testnet**.

- **Frontend**: Nuxt 4 + Vue 3
- **Backend**: Nitro (server routes de Nuxt)
- **Blockchain**: Hedera Testnet — cuentas ECDSA, tópicos HCS, Mirror Node
- **Base de datos**: Neon DB (PostgreSQL serverless)
- **Deploy**: Railway (plan Hobby)

## Requisitos

- Node.js >= 22.19
- npm
- Una cuenta de Hedera Testnet (portal.hedera.com) con llaves del operador
- Un proyecto en Neon DB con su connection string

## Variables de entorno

Copia `.env.example` a `.env` y completa:

| Variable | Descripción |
|---|---|
| `OPERATOR_ID` | Account ID del operador (ej. `0.0.12345`) |
| `OPERATOR_KEY` | Llave privada DER codificada en hexadecimal |
| `NEW_ACCOUNT_PASSWORD` | Contraseña que debe ingresar el usuario para crear su cuenta |
| `NEON_DB` | Connection string de Neon DB (`postgres://...`) |
| `ADMIN_SCREEN_PASSWORD` | Contraseña de la pantalla `/admin` |
| `SESSION_SECRET` | Cadena aleatoria de al menos 32 caracteres para firmar la sesión del admin |
| `MIRROR_NODE_URL` | (opcional) URL del mirror node, por defecto testnet |
| `ACCOUNT_INITIAL_HBARS` | (opcional) HBAR inicial por cuenta, por defecto `3.1` |
| `ACCOUNT_MIN_HBARS` | (opcional) saldo mínimo para verificar, por defecto `3` |

> Nota: las cuentas nuevas se fondean con un poco más del mínimo (3.1 HBAR por defecto) porque la red descuenta una pequeña comisión de creación; así el saldo final queda por encima de los 3 HBAR requeridos.

## Ejecutar en local

```bash
npm install
npm run dev
```

La app queda en http://localhost:3000

- `/` — pantalla del usuario (crear cuenta, chat, llaves)
- `/admin` — panel del administrador (login, crear tópico, chat)

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Railway

1. Subir el repositorio a GitHub/GitLab.
2. En Railway: **New Project → Deploy from GitHub repo**.
3. Configurar las variables de entorno del servicio (las mismas del `.env`, excepto `MIRROR_NODE_URL` si se usa el default).
4. Railway detecta Node y ejecuta `npm run build` + `npm start` automáticamente si `package.json` tiene script `start`. Si falta, agregar:
   ```json
   "start": "node .output/server/index.mjs"
   ```
5. La base de datos `topics` se crea sola al arrancar la app.

## Prueba de Hedera

`scripts/test-hedera.mjs` ejecuta un flujo completo contra Testnet
(crea cuenta, tópico y mensaje). Uso:

```bash
node scripts/test-hedera.mjs
```

## Estructura

```
app/            # frontend Nuxt (páginas, componentes, composables)
  pages/        # / (usuario), /chat, /keys, /admin/*
  components/   # ChatBox.vue (chat compartido), Banner.vue
  utils/        # wallet.js (localStorage), mirror.js (mirror node), auth.js
i18n/locales/   # textos de la interfaz (es.json)
server/
  api/          # endpoints REST
  utils/        # hedera.js, db.js, session.js, config.js
  plugins/      # initDb.js (crea tablas al arrancar)
scripts/        # test-hedera.mjs
```
