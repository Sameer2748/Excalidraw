export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private messageHandlers: ((event: MessageEvent) => void)[] = [];

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve(this.socket);
        return;
      }

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("WebSocket opened");
        resolve(this.socket!);
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.socket.onmessage = (event) => {
        this.messageHandlers.forEach((handler) => handler(event));
      };

      this.socket.onclose = () => {
        console.log("WebSocket closed");
        this.socket = null;
      };
    });
  }

  addMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
