import { defaultConfig, type PresenceConfig } from "../shared/config.js";
import { presencePayloadSchema, type PresencePayload } from "../shared/types.js";

const PUBLISH_TIMEOUT_MS = 2_000;

export async function publishPresence(payload: PresencePayload, config: Pick<PresenceConfig, "serverHost" | "serverPort"> = defaultConfig): Promise<void> {
  const parsed = presencePayloadSchema.parse(payload);
  const url = `http://${config.serverHost}:${config.serverPort}/presence`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(parsed),
    signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`Presence publish failed: ${response.status} ${response.statusText}`);
  }
}

export async function clearPresence(config: Pick<PresenceConfig, "serverHost" | "serverPort"> = defaultConfig): Promise<void> {
  const url = `http://${config.serverHost}:${config.serverPort}/clear`;

  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`Presence clear failed: ${response.status} ${response.statusText}`);
  }
}
