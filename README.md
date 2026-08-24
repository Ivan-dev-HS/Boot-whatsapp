# Boot-whatsapp 🛒

Aplicación web para gestionar una lista de la compra compartida (tú y tu
pareja) y comparar precios entre **Lidl, Plus Fresc y Bonpreu/Esclat**,
mostrando en qué supermercado sale más barato cada producto.

Funciona en dos modos, con la misma interfaz:

- **Con servidor propio**: guarda la lista en una base de datos y descarga
  las ofertas reales de cada supermercado.
- **Sin servidor, directamente en GitHub Pages**: la app detecta que no hay
  backend y funciona igualmente, guardando la lista en el propio navegador
  (`localStorage`) y comparando contra un catálogo de ofertas de ejemplo. Es
  la forma más rápida de abrirla desde el móvil sin instalar ni configurar
  nada — ver [Abrirla directamente en GitHub Pages](#abrirla-directamente-en-github-pages-sin-servidor).

## Cómo funciona

1. Abres la app en el navegador (del ordenador o del móvil) y añades los
   productos que soléis comprar.
2. Le das a **Comparar precios**: se compara tu lista con las ofertas
   vigentes de los 3 supermercados usando coincidencia difusa de nombres
   (para que "leche" encuentre "Leche entera Pilgrim 1L", por ejemplo), y se
   muestra el supermercado más barato para cada producto.
3. La lista se guarda automáticamente, así que sigue ahí la próxima vez que
   abras la app.

## Abrirla directamente en GitHub Pages (sin servidor)

1. En el repositorio de GitHub: **Settings → Pages**.
2. En "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: la rama de este proyecto, carpeta **`/docs`** → **Save**.
4. GitHub te da una URL tipo `https://<tu-usuario>.github.io/<repositorio>/`.
   Ábrela y ya está: verás el aviso "📦 Modo de ejemplo" arriba del todo,
   indicando que las ofertas mostradas son datos de muestra (GitHub Pages no
   puede ejecutar un servidor real ni descargar las webs de los
   supermercados). La lista de la compra sí funciona de verdad, guardada en
   tu propio navegador.
5. En el iPhone, ábrela en Safari y pulsa **Compartir → Añadir a pantalla de
   inicio** para tenerla como una app, a pantalla completa.

`docs/` es una copia exacta de `public/`. Si modificas `public/`, ejecuta
`npm run sync-docs` antes de hacer commit para mantenerlas iguales.

## Puesta en marcha con servidor propio (ofertas reales)

```bash
npm install
cp .env.example .env
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para producción:

```bash
npm run build
npm start
```

### Probar con datos de ejemplo (con servidor)

Pon `USE_MOCK_SCRAPERS=true` en tu `.env` para que el servidor también use
el catálogo de muestra en vez de descargar las páginas reales — útil
mientras ajustas los scrapers.

## Desplegar el servidor en un VPS gratuito (para ofertas reales desde cualquier sitio) ☁️

Si quieres las ofertas reales (no las de ejemplo) accesibles desde el móvil
estés donde estés, **Oracle Cloud "Always Free"** da una máquina virtual
gratis para siempre. Pasos:

1. Crea cuenta y VM en [oracle.com/cloud/free](https://www.oracle.com/cloud/free/):
   forma *Always Free* AMD `VM.Standard.E2.1.Micro` (x86, 1 GB RAM), Ubuntu 22.04.
2. Conéctate por SSH e instala Node.js:
   ```bash
   ssh -i tu_clave.key ubuntu@<IP_PUBLICA_DE_LA_VM>
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Clona y configura:
   ```bash
   git clone https://github.com/Ivan-dev-HS/Boot-whatsapp.git
   cd Boot-whatsapp
   npm install
   npm run build
   cp .env.example .env
   ```
4. Abre el puerto (por defecto `3000`) en el "Security List" de la VM en la
   consola de Oracle Cloud, y arranca:
   ```bash
   npm start
   ```
5. Para que siga corriendo siempre, con `systemd`:
   ```bash
   sudo tee /etc/systemd/system/boot-whatsapp.service > /dev/null <<'EOF'
   [Unit]
   Description=Boot-whatsapp
   After=network-online.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/Boot-whatsapp
   ExecStart=/usr/bin/npm start
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable --now boot-whatsapp
   ```

> Para uso solo en casa (misma wifi) puedes saltarte todo esto y simplemente
> dejar `npm start` corriendo en tu ordenador, entrando desde el móvil a
> `http://<IP_LOCAL_DEL_ORDENADOR>:3000`.

## Sobre los scrapers de cada supermercado ⚠️

Los scrapers de `src/scrapers/{lidl,plusfresc,bonpreuesclat}.ts` descargan
la página de ofertas de cada cadena y extraen nombre + precio con
selectores CSS. **Estos selectores son una primera aproximación**: no ha
sido posible verificarlos contra el HTML real de cada web desde el entorno
donde se ha creado este proyecto (la red de ese entorno bloquea el acceso a
esos dominios), así que es muy probable que necesites ajustarlos:

1. Abre la página de ofertas del supermercado en tu navegador.
2. Con las herramientas de desarrollador (F12), localiza el elemento que
   envuelve cada producto en oferta, el nombre y el precio.
3. Ajusta las constantes `CARD_SELECTOR`, `NAME_SELECTOR` y `PRICE_SELECTOR`
   al principio del fichero del scraper correspondiente.

Si una web renderiza las ofertas con JavaScript y no hay forma de leerlas
con una petición HTTP normal (esto es probable en el caso de Lidl),
tendrás que sustituir ese scraper por uno basado en un navegador headless
(Playwright), manteniendo la misma interfaz `Scraper`.

Cada scraper que falle (web caída, selector desactualizado) simplemente no
aporta ofertas ese día — no bloquea a los demás ni rompe la app.

Bonpreu i Esclat son la misma cadena (dos nombres comerciales del mismo
grupo, con la misma tienda online), así que se tratan como un único
supermercado en la app.

## Arquitectura

```
src/
  config.ts               variables de entorno
  db/                      conexión y esquema SQLite
  products/                lista de la compra
  offers/                  ofertas descargadas (por tienda)
  scrapers/                un módulo por supermercado + interfaz común
  matching/                normalización de texto y comparación difusa
  server.ts                servidor Express + API REST
public/                    frontend (HTML/CSS/JS sin build), con detección
                            automática de backend y modo autónomo
docs/                      copia de public/ para GitHub Pages
```

`products`, `offers`, `scrapers` y `matching` son el núcleo: no saben nada
de la interfaz web, por lo que añadir un supermercado nuevo consiste en
crear un fichero en `src/scrapers/` que implemente la interfaz `Scraper` y
registrarlo en `src/scrapers/index.ts` (y replicar el mismo catálogo en
`MOCK_OFFERS` dentro de `public/app.js` si quieres que también aparezca en
el modo sin servidor).
