# HOLLOW BITS Web

Sitio oficial, consola de cuenta y superficie web de **HOLLOW BITS**, el DAW desktop-first impulsado por **ALLYX** y desarrollado junto a **Ethereal Sounds**.

> Estado de arquitectura: este repositorio se mantiene operativo durante la recuperación técnica. La fuente canónica convergerá en `aldonovar/hollow-bits` mediante un monorepo con paquetes compartidos.

## Responsabilidades actuales

- sitio comercial y narrativa de producto;
- autenticación, configuración y consola de usuario;
- DAW ejecutable en navegador bajo `/engine`;
- Cloudflare Pages Functions para APIs, webhooks y operaciones server-only;
- integración con Supabase;
- cabeceras de aislamiento necesarias para audio, workers y WASM.

## Stack

- React + TypeScript + Vite
- React Router
- GSAP + ScrollTrigger
- Lenis
- Supabase
- Cloudflare Pages + Pages Functions

## Desarrollo

```bash
npm install
npm run dev
```

## Validación

```bash
npm run test:contract
npm run build
```

El pipeline de GitHub Actions ejecuta instalación reproducible con `npm ci`, verifica el contrato del ecosistema y genera el build de producción.

## Previsualización

Previsualización con el runtime de Cloudflare Pages:

```bash
npm run preview:edge
```

Previsualización estática de Vite, útil solo para revisar el frontend sin Pages Functions:

```bash
npm run preview:vite
```

## Estructura base

- `src/App.tsx`: composición de rutas para marketing, consola y motor web.
- `src/daw/`: copia transitoria del DAW durante la migración al paquete compartido.
- `src/hollowbits-core/`: copia transitoria del contrato compartido.
- `functions/api/`: Cloudflare Pages Functions.
- `supabase/`: migraciones y configuración de backend.
- `public/_headers`: seguridad, CSP y aislamiento entre orígenes.
- `public/_redirects`: fallback SPA para React Router.

## Despliegue de producción

El runtime soportado durante la recuperación es **Cloudflare Pages**.

1. Conectar `aldonovar/hollow-web` a Cloudflare Pages.
2. Usar `npm run build` como comando de build.
3. Usar `dist` como directorio de salida.
4. Configurar en Cloudflare las variables requeridas por Pages Functions y Supabase.
5. Verificar `/api/health`, autenticación, webhooks, almacenamiento, `/console` y `/engine` antes de promover el despliegue.

`vercel.json` no representa un backend equivalente: Vercel no ejecuta directamente las Cloudflare Pages Functions de `functions/`. No debe considerarse un despliegue productivo válido sin una adaptación explícita y pruebas separadas.

## Riesgos abiertos prioritarios

- El DAW web y el DAW desktop aún están duplicados.
- El contrato `hollowbits-core` todavía existe en dos repositorios.
- La integración de Gemini debe migrar a un endpoint server-only; una clave de proveedor nunca debe formar parte del bundle del navegador o del renderer Electron.
- Marketing, consola y motor deben separarse en módulos o entradas de build para reducir carga y efectos globales innecesarios.

El plan completo de recuperación se mantiene en `aldonovar/hollow-bits/docs/UNIFIED_RECOVERY_PLAN.md`.