import { db } from "../database/db";
import { eq } from "drizzle-orm";
import { Utms, type Utm, type NewUtm } from "../schemas/utms";

export class UtmRepository {
  async findAll(): Promise<Utm[]> {
    return await db.select().from(Utms).all();
  }

  async findById(id: number): Promise<Utm | null> {
    const row = await db.select().from(Utms).where(eq(Utms.id, id)).get();
    return row ?? null;
  }
  async delete(id: number): Promise<boolean> { 
    const row = await db.delete(Utms).where(eq(Utms.id, id)).returning().get();
    return !!row;
  }

  async create(data: NewUtm): Promise<Utm> {
    const row = await db
      .insert(Utms) 
      .values({
        name: data.name,
        ip: data.ip,
        port: data.port,
        location: data.location,
        environment: data.environment,
      })
      .returning()
      .get();

    return row as Utm;
  }

  async update(id: number, data: Partial<NewUtm>): Promise<Utm | null> {
    const row = await db
      .update(Utms)
      .set({ 
        ...data, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(Utms.id, id))
      .returning()
      .get();

    return row ?? null;
  }
}