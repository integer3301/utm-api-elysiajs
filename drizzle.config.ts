import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schemas/utms.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "data/egais.db",
  },
});
