import Peer, { type DataConnection } from "peerjs";

import { type ConnectionStatus } from "./types";

export interface ConnectionEvent {
  status: ConnectionStatus;
  localPeerId?: string;
  peerId?: string;
  error?: Error;
}

type MessageCallback = (data: unknown, peerId: string) => void;
type ConnectionCallback = (event: ConnectionEvent) => void;

export class PeerManager {
  private peer: Peer | null = null;

  private readonly connections = new Map<string, DataConnection>();

  private readonly messageCallbacks = new Set<MessageCallback>();

  private readonly connectionCallbacks = new Set<ConnectionCallback>();

  private status: ConnectionStatus = "disconnected";

  private hostMode = false;

  public get isHost(): boolean {
    return this.hostMode;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getPeerId(): string | null {
    return this.peer?.id ?? null;
  }

  public getConnectedPeerIds(): string[] {
    return [...this.connections.keys()];
  }

  /**
   * Creates a room and hosts incoming PeerJS connections using roomId as peer id.
   */
  public async createRoom(roomId: string): Promise<void> {
    if (!roomId) {
      throw new Error("roomId is required to create a room.");
    }

    this.disconnect();
    this.hostMode = true;
    this.updateStatus({ status: "connecting" });

    this.peer = new Peer(roomId);
    await this.awaitPeerOpen(this.peer);

    this.peer.on("connection", (connection) => {
      this.registerConnection(connection);
    });

    this.attachPeerErrorHandler(this.peer);
    this.attachPeerCloseHandler(this.peer);

    this.updateStatus({ status: "connected", localPeerId: this.peer.id });
  }

  /**
   * Joins a room by creating a local peer and connecting to roomId host.
   */
  public async joinRoom(roomId: string): Promise<void> {
    if (!roomId) {
      throw new Error("roomId is required to join a room.");
    }

    this.disconnect();
    this.hostMode = false;
    this.updateStatus({ status: "connecting" });

    this.peer = new Peer();
    await this.awaitPeerOpen(this.peer);

    this.attachPeerErrorHandler(this.peer);
    this.attachPeerCloseHandler(this.peer);

    const connection = this.peer.connect(roomId, { reliable: true });
    await this.awaitConnectionOpen(connection);
    this.registerConnection(connection);

    this.updateStatus({
      status: "connected",
      localPeerId: this.peer.id,
      peerId: roomId,
    });
  }

  public send(data: unknown): void {
    if (this.connections.size === 0) {
      throw new Error("No active peers to send data to.");
    }

    for (const connection of this.connections.values()) {
      if (!connection.open) {
        continue;
      }
      connection.send(data);
    }
  }

  public onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  public onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    callback({ status: this.status, localPeerId: this.getPeerId() ?? undefined });
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  public disconnect(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.updateStatus({ status: "disconnected" });
  }

  private registerConnection(connection: DataConnection): void {
    this.connections.set(connection.peer, connection);

    connection.on("data", (data) => {
      for (const callback of this.messageCallbacks) {
        callback(data, connection.peer);
      }
    });

    connection.on("close", () => {
      this.connections.delete(connection.peer);
      const nextStatus: ConnectionStatus =
        this.connections.size > 0 || this.hostMode ? "connected" : "disconnected";
      this.updateStatus({
        status: nextStatus,
        localPeerId: this.getPeerId() ?? undefined,
        peerId: connection.peer,
      });
    });

    connection.on("error", (error) => {
      const typedError = error instanceof Error ? error : new Error(String(error));
      this.updateStatus({
        status: "error",
        localPeerId: this.getPeerId() ?? undefined,
        peerId: connection.peer,
        error: typedError,
      });
    });

    this.updateStatus({
      status: "connected",
      localPeerId: this.getPeerId() ?? undefined,
      peerId: connection.peer,
    });
  }

  private attachPeerErrorHandler(peer: Peer): void {
    peer.on("error", (error) => {
      const typedError = error instanceof Error ? error : new Error(String(error));
      this.updateStatus({
        status: "error",
        localPeerId: this.getPeerId() ?? undefined,
        error: typedError,
      });
    });
  }

  private attachPeerCloseHandler(peer: Peer): void {
    peer.on("close", () => {
      this.connections.clear();
      this.updateStatus({ status: "disconnected" });
    });
  }

  private updateStatus(event: ConnectionEvent): void {
    this.status = event.status;
    for (const callback of this.connectionCallbacks) {
      callback(event);
    }
  }

  private awaitPeerOpen(peer: Peer): Promise<void> {
    return new Promise((resolve, reject) => {
      const onOpen = (): void => {
        cleanup();
        resolve();
      };

      const onError = (error: unknown): void => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      const cleanup = (): void => {
        peer.off("open", onOpen);
        peer.off("error", onError);
      };

      peer.on("open", onOpen);
      peer.on("error", onError);
    });
  }

  private awaitConnectionOpen(connection: DataConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      const onOpen = (): void => {
        cleanup();
        resolve();
      };

      const onError = (error: unknown): void => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      const cleanup = (): void => {
        connection.off("open", onOpen);
        connection.off("error", onError);
      };

      connection.on("open", onOpen);
      connection.on("error", onError);
    });
  }
}
