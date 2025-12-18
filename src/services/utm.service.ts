import { NewUtm, Utm } from "../schemas/utms"; // Предположим, тип называется Utm
import { UtmRepository } from "../repositories/utm.repository";
import { WebSocketService } from "./ws.service";

export class UtmService {
  public cache = new Map<number, any>();
  private wsClient = new WebSocketService();

  constructor(private repo: UtmRepository) {
    this.initMonitoring();
  }

  private async initMonitoring() {
    const allServers = await this.repo.findAll();
    allServers.forEach((server) => this.startServerMonitoring(server));
  }

  private startServerMonitoring(server: Utm) {
    this.wsClient.connect(
      { id: server.id, ip: server.ip, port: server.port },
      {
        onStatusChange: (status) =>
          this.cache.set(server.id, { ...this.cache.get(server.id), status }),
        onMessage: (data) =>
          this.cache.set(server.id, {
            ...this.cache.get(server.id),
            ...data,
            status: "online",
          }),
      }
    );
  }

  /// crud операции
  async getAllUtms(): Promise<Utm[]> {
    return await this.repo.findAll();
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
      console.log(`[CLEANUP] Кэш для УТМ ID:${id} очищен`);
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
