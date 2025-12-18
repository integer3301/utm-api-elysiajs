// src/controllers/utm.controllers.ts
import { Elysia, t } from "elysia";
import { UtmService } from "../services/utm.service";
import { NewUtm } from "../schemas/utms";
import { logger } from "@bogeychan/elysia-logger";

export const UtmController = (utmService: UtmService) => 
  new Elysia({ prefix: "/utm" })
    // HTTP 
    .get("/", () => utmService.getAllUtms())
    .get("/:id", ({ params: { id } }) => utmService.getUtmById(Number(id)))
    .delete("/:id", ({ params: { id } }) => utmService.deleteUtm(Number(id)))
    .post("/", async ({ body, set }) => {
        try {
            return await utmService.addUtm(body as NewUtm);
        } catch (e: any) {
            set.status = 400;
            return { error: e.message };
        }
    }, {
        body: t.Object({
            name: t.String(),
            ip: t.String(),
            port: t.Number(),
            location: t.Optional(t.String()),
            environment: t.String({ enum: ["docker", "arm", "closed"] }),
        })
    })

    // WebSocket 
    .ws("/monitor", {
        open(ws) {
            ws.send({ type: "FULL_CACHE", data: utmService.getCacheArray() });
        
            const onUpdate = (update: any) => ws.send({ type: "UPDATE", data: update });
                        (ws.data as any).onUpdate = onUpdate;
            utmService.on("update", onUpdate);
        },
        close(ws) {
            utmService.off("update", (ws.data as any).onUpdate);
        }
    });