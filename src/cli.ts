import readline from "node:readline";

// Modo de prueba por terminal: usa exactamente el mismo motor de comandos
// que el bot de WhatsApp (src/whatsapp/commands.ts), pero leyendo lo que
// escribas en la consola en vez de mensajes de WhatsApp. Usa siempre datos
// de ofertas simulados, para poder probar todo sin depender de las webs de
// los supermercados ni de una conexión a WhatsApp.
//
// Estas variables de entorno se fijan ANTES de cargar el resto de módulos
// (con require, no con import) porque config.ts las lee en el momento en
// que se importa: con un `import` normal, TypeScript compila los requires
// al principio del fichero y se ejecutarían antes que esta asignación.
process.env.USE_MOCK_SCRAPERS = "true";
process.env.DATABASE_PATH ??= "./data/demo.sqlite";

const CLI_CHAT_ID = "cli-demo";

async function main() {
  require("./db");
  const { handleCommand } = require("./whatsapp/commands") as typeof import("./whatsapp/commands");
  const { HELP_MESSAGE } = require("./whatsapp/messages") as typeof import("./whatsapp/messages");

  console.log("🧪 Modo de prueba de Boot-whatsapp (sin conexión a WhatsApp)");
  console.log("Usando ofertas de ejemplo. Escribe comandos como si le hablaras al bot.\n");
  console.log(HELP_MESSAGE);
  console.log("\nEscribe 'salir' para terminar.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
  rl.prompt();

  for await (const line of rl) {
    const text = line.trim();
    if (text === "salir" || text === "exit") break;

    const reply = await handleCommand(CLI_CHAT_ID, text);
    if (reply) {
      console.log(`\n${reply}\n`);
    } else {
      console.log("(mensaje ignorado: no es un comando reconocido, prueba con !ayuda)\n");
    }
    rl.prompt();
  }

  rl.close();
  console.log("\n👋 Hasta luego.");
}

main();
