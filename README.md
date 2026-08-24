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
