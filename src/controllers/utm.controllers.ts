import Elysia, { t } from "elysia";
import { UtmRepository } from "../repositories/utm.repository";
import { UtmService } from "../services/utm.service";
import { NewUtm } from "../schemas/utms";

const utmService = new UtmService(new UtmRepository());

export const UtmController = new Elysia({ prefix: "/utm" })
  .get("/", () => utmService.getAllUtms())
  .get("/:id", ({ params: { id } }) => utmService.getUtmById(Number(id)))
  .delete('/:id', ({ params: { id } }) => utmService.deleteUtm(Number(id)))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await utmService.addUtm(body as NewUtm);
        set.status = 201;
        return result;
      } catch (e: any) {
        set.status = 400;
        return { error: e.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        ip: t.String(),
        port: t.Number(),
        location: t.Optional(t.String()),
        environment: t.String({ enum: ["docker", "arm", "closed"] }),
      }),
    }
  );
