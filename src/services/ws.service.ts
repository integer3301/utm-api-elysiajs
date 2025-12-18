import { logger } from "../utils/logger";

export type WebSocketHandlers = {
  onMessage: (data: any) => void;
  onStatusChange: (status: "online" | "offline") => void;
};

type ActiveConnection = {
  ws: WebSocket | null;
  reconnectTimer: any;
  isTerminated: boolean; 
};

export class WebSocketService {
  private connections = new Map<number, ActiveConnection>();

  public connect(
    server: { id: number; ip: string; port: number }, // id
    handlers: WebSocketHandlers
  ) {
    const { id, ip, port } = server;


    const connectionState: ActiveConnection = {
      ws: null,
      reconnectTimer: null,
      isTerminated: false
    };
    this.connections.set(id, connectionState);

    const run = async () => {
      if (connectionState.isTerminated) return;

      try {
        const infoRes = await fetch(
          `http://${ip}:${port}/websocket/info?t=${Date.now()}`
        );
        const info = await infoRes.json();
        const sid = Math.random().toString(36).substring(2, 10);
        const wsUrl = `ws://${ip}:${port}/websocket/000/${sid}/websocket`;
     console.log(
        `${prefix} info получено: websocket=${info.websocket}, cookie_needed=${info.cookie_needed}`
      );
        const ws = new WebSocket(wsUrl);
        connectionState.ws = ws; // Сохраняем ссылку на сокет

        ws.onopen = () => {
          ws.send(JSON.stringify(["CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0"]));
        };

        ws.onmessage = (event) => {
          const msg = event.data.toString();
          if (msg === "h") return;
          if (msg.startsWith("a[")) {
            const stompFrame = JSON.parse(msg.slice(1))[0];
            
            if (stompFrame.startsWith("CONNECTED")) {
              handlers.onStatusChange("online");
              ws.send(JSON.stringify(["SUBSCRIBE\nid:sub-0\ndestination:/app/documents\n\n\0"]));
              ws.send(JSON.stringify(["SUBSCRIBE\nid:sub-1\ndestination:/topic/documents\n\n\0"]));

              console.log(`[WS] Подключение к УТМ ${ip}:${port} установлено`);
            }

            if (stompFrame.startsWith("MESSAGE")) {
              const body = stompFrame.split("\n\n")[1]?.split("\0")[0];
              if (body) {
                try {
                  handlers.onMessage(JSON.parse(body));
                } catch (e) {
                  logger.error(`Ошибка парсинга JSON от ${ip}: ${e}`);
                }
              }
            }
          }
        };

        ws.onclose = () => {
          handlers.onStatusChange("offline");
          if (!connectionState.isTerminated) {
            clearTimeout(connectionState.reconnectTimer);
            connectionState.reconnectTimer = setTimeout(run, 5000);
          }
        };

        ws.onerror = () => ws.close();

      } catch (err) {
        handlers.onStatusChange("offline");
        if (!connectionState.isTerminated) {
          clearTimeout(connectionState.reconnectTimer);
          connectionState.reconnectTimer = setTimeout(run, 10000);
        }
      }
    };

    run();
  }

  public disconnectById(id: number) {
    const conn = this.connections.get(id);
    if (conn) {
      console.log(`[WS] Остановка мониторинга сервера ID: ${id}`);
      conn.isTerminated = true; 
      clearTimeout(conn.reconnectTimer); 
      
      if (conn.ws) {
        conn.ws.onclose = null; 
        conn.ws.close();
      }
      
      this.connections.delete(id);
    }
  }
}