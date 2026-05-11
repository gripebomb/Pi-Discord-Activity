export interface PresenceConfig {
  appName: string;
  rpcClientId: string;
  serverHost: string;
  serverPort: number;
  privacyMode: boolean;
  includeProjectName: boolean;
  debounceMs: number;
  autostartHelper: boolean;
  debugLogging: boolean;
  presenceTimeoutMs: number;
}

export const defaultConfig: PresenceConfig = {
  appName: "Pi Coding Agent",
  rpcClientId: process.env.DISCORD_RPC_CLIENT_ID ?? "1495329514417426522",
  serverHost: process.env.PI_PRESENCE_HOST ?? "127.0.0.1",
  serverPort: Number(process.env.PI_PRESENCE_PORT ?? "42666"),
  privacyMode: process.env.PI_PRESENCE_PRIVACY_MODE !== "false",
  includeProjectName: process.env.PI_PRESENCE_INCLUDE_PROJECT === "true",
  debounceMs: Number(process.env.PI_PRESENCE_DEBOUNCE_MS ?? "2000"),
  autostartHelper: process.env.PI_PRESENCE_AUTOSTART_HELPER !== "false",
  debugLogging: process.env.PI_PRESENCE_DEBUG === "true",
  presenceTimeoutMs: Number(process.env.PI_PRESENCE_TIMEOUT_MS ?? "600000")
};
