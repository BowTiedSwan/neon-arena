import { type GameState, type VersionedState } from "./types";

export class StateSynchronizer<TState extends GameState = GameState> {
  private localState: VersionedState<TState> | null = null;

  private remoteState: VersionedState<TState> | null = null;

  /**
   * Wraps local state with a timestamp for network synchronization.
   */
  public syncState(state: TState): VersionedState<TState> {
    const versioned = this.toVersionedState(state);
    this.localState = versioned;
    return versioned;
  }

  /**
   * Stores and returns the latest remote state packet.
   */
  public receiveState(state: VersionedState<TState>): VersionedState<TState> {
    if (!Number.isFinite(state.timestamp)) {
      throw new Error("Remote state timestamp must be a finite number.");
    }
    this.remoteState = state;
    return state;
  }

  /**
   * Reconciles local and remote state by preferring newer timestamps.
   */
  public reconcile(
    localState: VersionedState<TState> | TState,
    remoteState: VersionedState<TState> | TState,
  ): VersionedState<TState> {
    const local = this.toVersionedState(localState);
    const remote = this.toVersionedState(remoteState);

    if (remote.timestamp > local.timestamp) {
      this.localState = remote;
      this.remoteState = remote;
      return remote;
    }

    if (remote.timestamp < local.timestamp) {
      this.localState = local;
      this.remoteState = remote;
      return local;
    }

    const localTieBreaker = JSON.stringify(local.state);
    const remoteTieBreaker = JSON.stringify(remote.state);
    const winner = remoteTieBreaker > localTieBreaker ? remote : local;

    this.localState = winner;
    this.remoteState = remote;
    return winner;
  }

  public getLatestLocalState(): VersionedState<TState> | null {
    return this.localState;
  }

  public getLatestRemoteState(): VersionedState<TState> | null {
    return this.remoteState;
  }

  private toVersionedState(state: VersionedState<TState> | TState): VersionedState<TState> {
    if (this.isVersionedState(state)) {
      return state;
    }

    return {
      state,
      timestamp: Date.now(),
    };
  }

  private isVersionedState(value: unknown): value is VersionedState<TState> {
    if (!value || typeof value !== "object") {
      return false;
    }

    const typedValue = value as Partial<VersionedState<TState>>;
    return (
      "state" in typedValue &&
      typeof typedValue.timestamp === "number" &&
      Number.isFinite(typedValue.timestamp)
    );
  }
}
