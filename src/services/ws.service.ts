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

    if (this.connections.has(id)) {
      this.disconnectById(id);
    }


    const connectionState: ActiveConnection = {
      ws: null,
      reconnectTimer: null,
      isTerminated: false,
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
        logger.info(
          `Respone: websocket=${info.websocket}, cookie_needed=${info.cookie_needed}`
        );
        const ws = new WebSocket(wsUrl);
        connectionState.ws = ws; 

        ws.onopen = () => {
          ws.send(
            JSON.stringify([
              "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0",
            ])
          );
        };

        ws.onmessage = (event) => {
          const msg = event.data.toString();
          if (msg === "h") return;
          if (msg.startsWith("a[")) {
            const stompFrame = JSON.parse(msg.slice(1))[0];

            if (stompFrame.startsWith("CONNECTED")) {
              handlers.onStatusChange("online");
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
              logger.info(`Connected: ${ip}:${port} success`)
            }

            if (stompFrame.startsWith("MESSAGE")) {
              const body = stompFrame.split("\n\n")[1]?.split("\0")[0];
              if (body) {
                try {
                  handlers.onMessage(JSON.parse(body));
                  logger.info(JSON.parse(body))
                } catch (e) {
                  logger.error(`Error parsing from ${ip}: ${e}`);
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
        const reason = err.name === 'AbortError' ? 'Timeout' : err.message;
        logger.error(`Error connected ${ip}:${port} (${reason})`);
        
        handlers.onStatusChange("offline");
        
        if (!connectionState.isTerminated) {
          clearTimeout(connectionState.reconnectTimer);
          connectionState.reconnectTimer = setTimeout(run, 10000);
        }
      }
    };
    logger.info(`Register run() for ${ip}`); // ЛОГ 4
    run();
  }

  public disconnectById(id: number) {
    const conn = this.connections.get(id);
    if (conn) {
      logger.info(`Stop monitoring: ${id}`);
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
