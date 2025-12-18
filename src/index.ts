import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";
import cors from "@elysiajs/cors";

import { UtmController } from "./controllers/utm.controllers";
import { UtmRepository } from "./repositories/utm.repository";
import { UtmService } from "./services/utm.service";

const utmRepository = new UtmRepository();
const utmService = new UtmService(utmRepository);

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173", 
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  )
  .use(logger())
  .group("/api/v1", (app) => app.use(UtmController(utmService)))

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
