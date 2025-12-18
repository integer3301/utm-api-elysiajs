import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { UtmController } from "./controllers/utm.controllers";
import { WebSocketService } from "./services/ws.service";
import { UtmRepository } from "./repositories/utm.repository";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173", 
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  )
  .use(logger())
  .group("/api/v1", (app) => app.use(UtmController))

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
