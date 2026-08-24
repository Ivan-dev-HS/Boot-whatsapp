# Boot-whatsapp 🛒

Aplicación web para gestionar una lista de la compra compartida (tú y tu
pareja) y comparar precios entre **Lidl, Aldi, Plus Fresc y Esclat**,
mostrando en qué supermercado sale más barato cada producto.

El bot de WhatsApp (comandos `!añadir`, `!lista`, `!comparar`... y avisos
automáticos de ofertas) también está incluido y listo, pero queda como algo
opcional para conectar más adelante — ver la sección
[Bot de WhatsApp (opcional)](#bot-de-whatsapp-opcional-para-más-adelante).

## Cómo funciona

1. Abres la app web en el navegador (del ordenador o del móvil) y añades los
   productos que soléis comprar.
2. Le das a **Comparar precios**: la app descarga las ofertas vigentes de
   los 4 supermercados, las compara con tu lista usando coincidencia difusa
   de nombres, y te muestra el supermercado más barato para cada producto.
3. La lista se guarda en una base de datos SQLite local, así que sigue ahí
   la próxima vez que abras la app.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador. Para
producción:

```bash
npm run build
npm start
```

### Probar con datos de ejemplo

Pon `USE_MOCK_SCRAPERS=true` en tu `.env` para que la app use un catálogo de
ofertas simulado en vez de descargar las páginas reales — útil mientras
ajustas los scrapers o simplemente para ver la app funcionando de inmediato.

También existe un modo de prueba por terminal (`npm run demo`) que simula
los mismos comandos que usaría el bot de WhatsApp, con datos de ejemplo.

## Desplegar en un VPS gratuito (para acceder desde cualquier sitio) ☁️

Si quieres poder abrir la lista desde el móvil estés donde estés (no solo en
tu wifi de casa), **Oracle Cloud "Always Free"** da una máquina virtual
gratis para siempre. Pasos:

1. **Crea la cuenta y la VM**: regístrate en
   [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) y crea una
   instancia de computación con la forma *Always Free* (AMD
   `VM.Standard.E2.1.Micro`, x86, 1 GB RAM), imagen **Ubuntu 22.04**. Guarda
   la clave SSH que te genere el asistente.

2. **Conéctate por SSH**:
   ```bash
   ssh -i tu_clave.key ubuntu@<IP_PUBLICA_DE_LA_VM>
   ```

3. **Instala Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clona el repositorio y configúralo**:
   ```bash
   git clone https://github.com/Ivan-dev-HS/Boot-whatsapp.git
   cd Boot-whatsapp
   git checkout claude/whatsapp-price-comparison-bot-a6x4zy
   npm install
   npm run build
   cp .env.example .env
   nano .env   # PORT, MATCH_THRESHOLD, etc.
   ```

5. **Ábrelo al exterior**: en la consola de Oracle Cloud, añade una regla de
   entrada en el "Security List" de la VM para el puerto que uses (por
   defecto `3000`). Luego arráncalo:
   ```bash
   npm start
   ```
   Y entra desde el móvil a `http://<IP_PUBLICA_DE_LA_VM>:3000`.

6. **Déjalo corriendo siempre con systemd**, para que sobreviva a reinicios
   y a que cierres la sesión SSH:
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
   sudo journalctl -u boot-whatsapp -f   # ver los logs en directo
   ```

> Para uso solo en casa (misma wifi) puedes saltarte todo esto y simplemente
> dejar `npm start` corriendo en tu ordenador, entrando desde el móvil a
> `http://<IP_LOCAL_DEL_ORDENADOR>:3000`.

## Sobre los scrapers de cada supermercado ⚠️

Los scrapers de `src/scrapers/{lidl,aldi,plusfresc,esclat}.ts` descargan la
página de ofertas de cada cadena y extraen nombre + precio con selectores
CSS. **Estos selectores son una primera aproximación**: no ha sido posible
verificarlos contra el HTML real de cada web desde el entorno donde se ha
creado este proyecto (la red de ese entorno bloquea el acceso a esos
dominios), así que es muy probable que necesites ajustarlos:

1. Abre la página de ofertas del supermercado en tu navegador.
2. Con las herramientas de desarrollador (F12), localiza el elemento que
   envuelve cada producto en oferta, el nombre y el precio.
3. Ajusta las constantes `CARD_SELECTOR`, `NAME_SELECTOR` y `PRICE_SELECTOR`
   al principio del fichero del scraper correspondiente.

Si una web renderiza las ofertas con JavaScript y no hay forma de leerlas con
una petición HTTP normal (esto es probable en el caso de Lidl), tendrás que
sustituir ese scraper por uno basado en un navegador headless (Playwright),
manteniendo la misma interfaz `Scraper`.

Cada scraper que falle (web caída, selector desactualizado) simplemente no
aporta ofertas ese día — no bloquea a los demás ni rompe la app; el error
queda registrado en consola y en la respuesta de `/api/compare`.

## Bot de WhatsApp (opcional, para más adelante)

El bot original con comandos de WhatsApp sigue disponible en `src/index.ts`
y `src/whatsapp/`, comparte toda la misma base de datos y lógica de
comparación que la app web, y añade avisos automáticos de ofertas nuevas.
Para activarlo cuando quieras:

```bash
npm run bot:dev     # desarrollo
npm run bot:start   # producción (tras npm run build)
```

Al arrancar aparece un código QR en la terminal: escanéalo desde WhatsApp en
**Ajustes → Dispositivos vinculados → Vincular un dispositivo**. Usa tu
cuenta de WhatsApp normal (como WhatsApp Web), no requiere WhatsApp Business
ni aprobación de Meta. La sesión queda guardada en `.wwebjs_auth/`.

Comandos disponibles una vez conectado:

| Comando | Alias | Descripción |
|---|---|---|
| `!añadir <producto>` | `!add` | Añade un producto a la lista compartida del chat |
| `!quitar <producto>` | `!eliminar`, `!borrar` | Elimina un producto de la lista |
| `!lista` | `!list` | Muestra la lista actual |
| `!vaciar confirmar` | | Vacía toda la lista (pide confirmación) |
| `!comparar` | `!ofertas`, `!check` | Compara la lista ahora mismo contra las ofertas |
| `!ayuda` | `!help` | Muestra la ayuda |

Para limitarlo a tu chat de pareja: arranca el bot, escríbele `!ayuda` desde
ese chat, copia el `chat_id` que imprime por consola a `ALLOWED_CHAT_IDS` en
tu `.env`, y reinicia.

El bot usa Puppeteer (controla un Chromium real para hablar con WhatsApp
Web), así que si lo despliegas en un VPS con CPU ARM necesitarás instalar un
Chromium del sistema y apuntar `PUPPETEER_EXECUTABLE_PATH` en el `.env` (los
detalles están comentados en `.env.example`). La app web normal no necesita
nada de esto.

## Arquitectura

```
src/
  config.ts               variables de entorno
  db/                      conexión y esquema SQLite
  products/                lista de la compra
  offers/                  ofertas descargadas (por tienda)
  scrapers/                un módulo por supermercado + interfaz común
  matching/                normalización de texto y comparación difusa
  server.ts                app web (Express + API REST) — modo principal
  cli.ts                   modo de prueba por terminal (npm run demo)
  alerts/                  detección de ofertas nuevas + scheduler (cron, bot)
  whatsapp/                cliente whatsapp-web.js, comandos y mensajes (bot)
  index.ts                 arranque del bot de WhatsApp (opcional)
public/                    frontend de la app web (HTML/CSS/JS sin build)
```

`products`, `offers`, `scrapers` y `matching` son el núcleo compartido: no
saben nada de WhatsApp ni de la web, por lo que la app web (`server.ts`) y el
bot (`index.ts`) son simplemente dos interfaces distintas sobre la misma
lógica. Añadir un supermercado nuevo consiste en crear un fichero en
`src/scrapers/` que implemente la interfaz `Scraper` y registrarlo en
`src/scrapers/index.ts` — funciona igual para ambas interfaces.
