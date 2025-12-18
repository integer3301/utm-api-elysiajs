import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const Utms = sqliteTable("utm_servers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
  ip: text("ip").notNull(),
  port: integer("port").default(8080).notNull(),

  // 'docker' - контейнер, 'arm' - обычная установка на АРМ , 'closed' - пк у нас
  environment: text("environment", { enum: ["docker", "arm", "closed"] })
    .default("arm")
    .notNull(),

  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const getUtmUrl = (utm: Pick<Utm, "ip" | "port">, protocol = "http") => {
  return `${protocol}:${utm.ip}:${utm.port}`;
};

export type Utm = typeof Utms.$inferSelect;
export type NewUtm = typeof Utms.$inferInsert;
