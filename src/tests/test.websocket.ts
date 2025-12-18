import { logger } from "../utils/logger";

const testServers = [
  {

    id: 1,
    name: "Магазин Центр",
    ip: "10.100.96.211",
    port: 8080,
    slug: "093",
  },
    {
    id: 2,
    name: "Магазин Центр",
    ip: "10.100.79.211",
    port: 8080,
    slug: "093",
  },
  {
    id:3,
    name: "Магазин Север",
    ip: "10.100.96.211",
    port: 8080,
    slug: "095",
  }
];

class UtmTester {
  private cache = new Map<number, any>();

  constructor() {
    console.log("запуск тестового монитора утм...");
    testServers.forEach((s) => this.connect(s));
  }

  private async connect(server: any) {
    const prefix = `[${server.name} | ${server.ip}]`;

    try {
      console.log(`${prefix} запрос /info...`);
      const infoRes = await fetch(
        `http://${server.ip}:${server.port}/websocket/info?t=${Date.now()}`
      );
      const info = await infoRes.json();
      
      const cookie = infoRes.headers.get("set-cookie") || "";

      console.log(
        `${prefix} info получено: websocket=${info.websocket}, cookie_needed=${info.cookie_needed}`
      );

      const serverId = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const sessionId = Math.random().toString(36).substring(2, 10);
      const wsUrl = `ws://${server.ip}:${server.port}/websocket/${serverId}/${sessionId}/websocket`;

      console.log(`${prefix} открытие websocket...`);
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log(`${prefix} соединение открыто. отправка stomp connect...`);
        ws.send(
          JSON.stringify([
            "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0",
          ])
        );
      };

      ws.onmessage = (event) => {
        const msg = event.data.toString();

        if (msg === "h") {
          return;
        }

        if (msg.startsWith("a[")) {
          const stompFrame = JSON.parse(msg.slice(1))[0];

          if (stompFrame.startsWith("CONNECTED")) {
            console.log(
              `${prefix} stomp подключен. подписка на каналы...`
            );
            ws.send(
              JSON.stringify([
                "SUBSCRIBE\nid:sub-0\ndestination:/app/documents\n\n\0",
              ])
            );

            ws.send(
              JSON.stringify([
                "SUBSCRIBE\nid:sub-1\ndestination:/topic/documents\n\n\0",
              ])
            );
          }

          if (stompFrame.startsWith("MESSAGE")) {
            console.log(`${prefix} получены данные:`);

            const parts = stompFrame.split("\n\n");
            const body = parts[1]?.split("\0")[0];

            if (body) {
              try {
                const data = JSON.parse(body);
                this.cache.set(server.id, {
                  ...data,
                  updatedAt: new Date().toISOString()
                });
                console.table(data);
              } catch (e) {
                logger.info(`ошибка парсинга json: ${body}`);
              }
            }
          }
        }
      };

      ws.onclose = (e) => {
        console.log(
          `${prefix} соединение закрыто (${e.code}). реконнект через 5 сек...`
        );
        setTimeout(() => this.connect(server), 5000);
      };

      ws.onerror = (e) => {
        console.error(`${prefix} ошибка сокета`);
      };
    } catch (err: any) {
      console.error(`${prefix} ошибка подключения: ${err.message}`);
      setTimeout(() => this.connect(server), 10000);
    }
  }

  public getStatus() {
    return Array.from(this.cache.values());
  }
}

new UtmTester();