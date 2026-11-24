import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dataDir = "./.pgdata";
const db = new PGlite(dataDir);
await db.waitReady;

const server = new PGLiteSocketServer({
  db,
  port: 5432,
  host: "127.0.0.1",
});

await server.start();
console.log("Domora local PostgreSQL (PGlite) listening on 127.0.0.1:5432");

process.on("SIGINT", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
