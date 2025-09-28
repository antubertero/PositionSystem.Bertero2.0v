import { fetchStatusNow } from './api';

type Listener = (data: unknown) => void;

class StatusChannel {
  private listeners: Set<Listener> = new Set();
  private ws?: WebSocket;
  private interval?: number;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    try {
      const url = new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/ws/status';
      this.ws = new WebSocket(url.toString());
      this.ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'status_update') {
          this.emit(payload.payload);
        }
      };
      this.ws.onclose = () => {
        this.startPolling();
      };
    } catch (error) {
      console.warn('WS no disponible, fallback a polling', error);
      this.startPolling();
    }
  }

  private startPolling() {
    if (this.interval) return;
    this.interval = window.setInterval(async () => {
      try {
        const data = await fetchStatusNow();
        this.emit(data);
      } catch (error) {
        console.warn('Polling falló', error);
      }
    }, 3000);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(data: unknown) {
    this.listeners.forEach((listener) => listener(data));
  }
}

export const statusChannel = new StatusChannel();
