import { t } from "elysia";
import { Serve } from "elysia/dist/universal/server";

export class Server {
  id: number;
  name: string;
  location?: string;
  ip: string;
  port: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Server>) {
    this.id = data.id || 0;
    this.name = data.name || "";
    this.location = data.location || "";
    this.ip = data.ip || "";
    this.port = data.port || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static create(data: Omit<Server, "id" | "createdAt" | "updatedAt">): Server {
    return new Server(data);
  }
}
