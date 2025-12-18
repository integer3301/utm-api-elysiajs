import { Elysia } from 'elysia';
import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";

export class SQLiteDB {
  static query(arg0: string) {
      throw new Error("Method not implemented.");
  }
  private db: Database;

  constructor() {
    const dbDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(path.join(dbDir, "egais.db"));
    this.db.run("PRAGMA foreign_keys = ON");
    this.initSchema();
  }

  private initSchema() {
    const schemaPath = path.join(process.cwd(), "src/database/schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf-8");
      this.db.exec(schema);
    }
  }

  // Используем Generics для типизации ответов
  query<T>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  get<T>(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}

// Создаем инстанс
const dbInstance = new SQLiteDB();

// Экспортируем как плагин Elysia
export const dbPlugin = new Elysia({ name: 'db-plugin' })
  .decorate('db', dbInstance);