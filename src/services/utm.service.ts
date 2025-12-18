import { EventEmitter } from "events";

import { NewUtm, Utm } from "../schemas/utms"; // Предположим, тип называется Utm
import { UtmRepository } from "../repositories/utm.repository";
import { WebSocketService } from "./ws.service";
import { logger } from "../utils/logger";

export class UtmService extends EventEmitter {
  public cache = new Map<number, any>();
  private wsClient = new WebSocketService();

  constructor(private repo: UtmRepository) {
    super();
    this.initMonitoring();
  }

  private async initMonitoring() {
    const allServers = await this.repo.findAll();

    allServers.forEach((server) => {
      this.startServerMonitoring(server);
    });
  }

  private startServerMonitoring(server: Utm) {
    this.wsClient.connect(
      { id: server.id, ip: server.ip, port: server.port },
      {
        onStatusChange: (status) => {
          const current = this.cache.get(server.id) || {};
          const updated = { ...current, status };
          this.cache.set(server.id, updated);
          this.emit("update", { id: server.id, status });
        },
        onMessage: (data) => {
          const current = this.cache.get(server.id) || {};
          const updated = {
            ...current,
            ...data,
            status: "online",
            updatedAt: new Date().toISOString(),
          };
          this.cache.set(server.id, updated);

          this.emit("update", { id: server.id, ...data, status: "online" });
        },
      }
    );
  }
public getCacheArray() {
    return Array.from(this.cache.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  //crud
  async getAllUtms(): Promise<Utm[]> {
    const dbServers = await this.repo.findAll();

    return dbServers.map((server) => {
      const dynamicData = this.cache.get(server.id) || {
        status: "offline",
        documents: [],
      };
      return {
        ...server,
        ...dynamicData,
      };
    });
  }

  async getUtmById(id: number): Promise<Utm> {
    const server = await this.repo.findById(id);
    if (!server) throw new Error(`УТМ с ID ${id} не найден`);
    return server;
  }

  async deleteUtm(id: number): Promise<boolean> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`УТМ с ID ${id} не найден`);

    if (this.cache.has(id)) {
      this.cache.delete(id);
      logger.info(`Delete UTM id: ${id}`);
    }

    this.wsClient.disconnectById(id);

    return deleted;
  }
  async addUtm(data: NewUtm): Promise<Utm> {
    const newServer = await this.repo.create(data);
    this.startServerMonitoring(newServer);
    return newServer;
  }
}
