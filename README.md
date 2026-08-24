# Boot-whatsapp 🛒

Bot de WhatsApp para gestionar una lista de la compra compartida y comparar
precios entre **Lidl, Aldi, Plus Fresc y Esclat**, avisando por WhatsApp
cuando aparece una oferta nueva que coincide con algo de la lista.

## Cómo funciona

1. Tú y tu pareja escribís al bot (chat individual o de grupo) con comandos
   como `!añadir leche`.
2. El bot guarda la lista en una base de datos SQLite local, asociada a ese
   chat de WhatsApp.
3. Periódicamente (cron configurable, por defecto cada día a las 9:00) el
   bot descarga las ofertas vigentes de los 4 supermercados, las compara con
   tu lista usando coincidencia difusa de nombres, y te avisa por WhatsApp
   de las ofertas nuevas, indicando en qué supermercado sale más barato.
4. En cualquier momento puedes pedir `!comparar` para forzar la comprobación
   al momento.

La conexión a WhatsApp usa [`whatsapp-web.js`](https://wwebjs.dev/), que
vincula el bot a tu cuenta de WhatsApp normal (como WhatsApp Web) escaneando
un código QR. No requiere cuenta de WhatsApp Business ni aprobación de Meta.

## Comandos

| Comando | Alias | Descripción |
|---|---|---|
| `!añadir <producto>` | `!add` | Añade un producto a la lista compartida del chat |
| `!quitar <producto>` | `!eliminar`, `!borrar` | Elimina un producto de la lista |
| `!lista` | `!list` | Muestra la lista actual |
| `!vaciar confirmar` | | Vacía toda la lista (pide confirmación) |
| `!comparar` | `!ofertas`, `!check` | Compara la lista ahora mismo contra las ofertas |
| `!ayuda` | `!help` | Muestra la ayuda |

## Puesta en marcha

```bash
npm install
cp .env.example .env
# edita .env si quieres cambiar la hora de las alertas, restringir chats, etc.
npm run dev
```

Al arrancar por primera vez aparecerá un código QR en la terminal: escanéalo
desde WhatsApp en **Ajustes → Dispositivos vinculados → Vincular un
dispositivo**. La sesión queda guardada en `.wwebjs_auth/` para no tener que
volver a escanear cada vez.

Para producción:

```bash
npm run build
npm start
```

### Restringir el bot a tu chat de pareja

Por defecto el bot responde en cualquier chat donde alguien le escriba
comandos. Para limitarlo a tu chat (por ejemplo, un grupo con tu pareja):

1. Arranca el bot y escríbele `!ayuda` desde ese chat.
2. Mira la consola: el bot imprime el `chat_id` de cada mensaje que ignora o
   procesa.
3. Copia ese ID a `ALLOWED_CHAT_IDS` en tu `.env` (puedes poner varios
   separados por comas) y reinicia el bot.

### Probar sin conexión a los supermercados

Pon `USE_MOCK_SCRAPERS=true` en tu `.env` para usar un catálogo de ofertas
de ejemplo en vez de descargar las páginas reales. Útil para probar comandos,
el matching y las alertas sin depender de la disponibilidad de las webs.

## Desplegar en un VPS gratuito (para que esté siempre encendido) ☁️

El bot necesita estar ejecutándose de forma continua para poder mandar
alertas cualquier día. Si no quieres depender de tu ordenador ni comprar
hardware, **Oracle Cloud "Always Free"** da una máquina virtual gratis para
siempre (sin límite de tiempo de prueba). Pasos:

1. **Crea la cuenta y la VM**: regístrate en
   [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) y crea una
   instancia de computación con la forma *Always Free*. Recomendado: la
   forma AMD `VM.Standard.E2.1.Micro` (x86, 1 GB RAM) — más sencilla porque
   no necesitas configurar nada de Chromium. Elige imagen **Ubuntu 22.04**.
   Guarda la clave SSH que te genere el asistente.

2. **Conéctate por SSH** desde tu ordenador:
   ```bash
   ssh -i tu_clave.key ubuntu@<IP_PUBLICA_DE_LA_VM>
   ```

3. **Instala Node.js y añade memoria de intercambio** (con 1 GB de RAM
   conviene un poco de swap para que Chromium no se quede sin memoria):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

4. **Clona el repositorio y configúralo**:
   ```bash
   git clone https://github.com/Ivan-dev-HS/Boot-whatsapp.git
   cd Boot-whatsapp
   git checkout claude/whatsapp-price-comparison-bot-a6x4zy
   npm install
   npm run build
   cp .env.example .env
   nano .env   # ajusta ALERTS_CRON, ALLOWED_CHAT_IDS, etc.
   ```

5. **Vincula tu WhatsApp** (solo la primera vez, ejecútalo a mano para ver
   el código QR en la propia terminal SSH):
   ```bash
   npm start
   ```
   Escanéalo desde el móvil (**WhatsApp → Ajustes → Dispositivos
   vinculados**). Cuando veas "✅ Bot de WhatsApp conectado y listo.", para
   el proceso con `Ctrl+C` — la sesión ya ha quedado guardada en
   `.wwebjs_auth/`.

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

No necesitas abrir ningún puerto de entrada: el bot solo hace conexiones
salientes hacia WhatsApp y los supermercados.

> Si en tu región solo te ofrecen la forma **Ampere (ARM)** en vez de la AMD,
> funciona igual pero Puppeteer no trae un Chromium precompilado para ARM.
> Instala uno del sistema y apúntalo en `.env`:
> ```bash
> sudo apt-get install -y chromium-browser
> echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env
> ```

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
sustituir ese scraper por uno basado en un navegador headless. El proyecto ya
tiene Playwright/Chromium disponible en el entorno de desarrollo para eso;
bastaría con cambiar `fetchOffers()` en ese fichero para usar Playwright en
lugar de `axios` + `cheerio`, manteniendo la misma interfaz `Scraper`.

Cada scraper que falle (web caída, selector desactualizado) simplemente no
aporta ofertas ese día — no bloquea a los demás ni rompe el bot; el error
queda registrado en consola.

## Arquitectura

```
src/
  config.ts              variables de entorno
  db/                     conexión y esquema SQLite
  products/               lista de la compra (por chat)
  offers/                 ofertas descargadas (por tienda)
  scrapers/               un módulo por supermercado + interfaz común
  matching/               normalización de texto y comparación difusa
  alerts/                 detección de ofertas nuevas + scheduler (cron)
  whatsapp/               cliente whatsapp-web.js, comandos y mensajes
  index.ts                arranque de la aplicación
```

Añadir un supermercado nuevo consiste en crear un fichero en `src/scrapers/`
que implemente la interfaz `Scraper` y registrarlo en `src/scrapers/index.ts`.
