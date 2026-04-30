import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

class PlantHubConnection {
  private connection: HubConnection | null = null;
  private starting: Promise<void> | null = null;

  private build(): HubConnection {
    // Relative path → Next.js rewrites this to the backend, same-origin from
    // the browser's perspective. Override with NEXT_PUBLIC_HUB_URL only if
    // pointing to a backend not co-served by Next.
    const url = process.env.NEXT_PUBLIC_HUB_URL ?? "/hubs/plant";
    return new HubConnectionBuilder()
      .withUrl(url, {
        transport:
          HttpTransportType.WebSockets |
          HttpTransportType.ServerSentEvents |
          HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();
  }

  async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;
    if (this.starting) return this.starting;

    this.connection ??= this.build();
    this.starting = this.connection
      .start()
      .catch((err) => {
        console.error("SignalR connection failed:", err);
        throw err;
      })
      .finally(() => {
        this.starting = null;
      });
    return this.starting;
  }

  async stop(): Promise<void> {
    if (!this.connection) return;
    await this.connection.stop();
  }

  on<T = unknown>(event: string, handler: (payload: T) => void): () => void {
    this.connection ??= this.build();
    this.connection.on(event, handler as (...args: unknown[]) => void);
    return () => this.connection?.off(event, handler as (...args: unknown[]) => void);
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

export const plantHub = new PlantHubConnection();
