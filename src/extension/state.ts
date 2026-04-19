import { defaultConfig } from "../shared/config.js";
import { type ActivityState, type PresencePayload } from "../shared/types.js";

/**
 * Presence state mapper for the Pi extension.
 *
 * Keeps the latest normalized presence snapshot and applies privacy defaults
 * before anything is sent to the helper daemon.
 */
export class PresenceState {
  private payload: PresencePayload = this.createBasePayload();

  startSession(partial: Partial<PresencePayload> = {}): PresencePayload {
    this.payload = this.createBasePayload({
      ...partial,
      state: partial.state ?? "starting",
      startedAt: partial.startedAt ?? Math.floor(Date.now() / 1000)
    });

    return this.snapshot();
  }

  update(partial: Partial<PresencePayload>): PresencePayload {
    this.payload = this.createBasePayload({
      ...this.payload,
      ...partial,
      privacyMode: partial.privacyMode ?? this.payload.privacyMode,
      startedAt: partial.startedAt ?? this.payload.startedAt
    });

    return this.snapshot();
  }

  setActivity(state: ActivityState): PresencePayload {
    return this.update({ state });
  }

  snapshot(): PresencePayload {
    return { ...this.payload };
  }

  private createBasePayload(partial: Partial<PresencePayload> = {}): PresencePayload {
    const privacyMode = partial.privacyMode ?? defaultConfig.privacyMode;
    const includeProjectName = !privacyMode && defaultConfig.includeProjectName;

    const payload: PresencePayload = {
      app: "pi-coding-agent",
      provider: partial.provider ?? "unknown",
      model: partial.model ?? "unknown",
      state: partial.state ?? "starting",
      startedAt: partial.startedAt ?? Math.floor(Date.now() / 1000),
      privacyMode
    };

    if (partial.sessionId) {
      payload.sessionId = partial.sessionId;
    }

    if (includeProjectName) {
      payload.projectName = partial.projectName ?? process.cwd().split(/[\\/]/).pop();
    }

    return payload;
  }
}
