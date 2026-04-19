import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defaultConfig, type PresenceConfig } from "../shared/config.js";

const LOG_PREFIX = "[pi-discord-activity]";
const HELPER_HEALTHCHECK_TIMEOUT_MS = 250;
const HELPER_STARTUP_TIMEOUT_MS = 5_000;
const HELPER_STARTUP_POLL_MS = 100;

let helperStartupPromise: Promise<void> | null = null;

export type SpawnLike = (
  command: string,
  args: readonly string[],
  options: {
    cwd: string;
    detached: boolean;
    stdio: "ignore";
    env: NodeJS.ProcessEnv;
  }
) => Pick<ChildProcess, "once" | "unref">;

interface HelperAutostartDeps {
  fetchImpl?: typeof fetch;
  spawnImpl?: SpawnLike;
  helperEntrypoint?: string;
  helperCwd?: string;
  processExecPath?: string;
  fileExists?: (path: string) => boolean;
  healthcheckTimeoutMs?: number;
  startupTimeoutMs?: number;
  pollIntervalMs?: number;
  debugLogging?: boolean;
}

export async function ensureHelperRunning(
  config: Pick<PresenceConfig, "serverHost" | "serverPort" | "autostartHelper"> = defaultConfig,
  deps: HelperAutostartDeps = {}
): Promise<void> {
  if (!config.autostartHelper) {
    return;
  }

  if (await isHelperReachable(config, deps.fetchImpl, deps.healthcheckTimeoutMs)) {
    return;
  }

  if (helperStartupPromise) {
    return helperStartupPromise;
  }

  const startupAttempt = (async () => {
    if (await isHelperReachable(config, deps.fetchImpl, deps.healthcheckTimeoutMs)) {
      return;
    }

    const helperEntrypoint = deps.helperEntrypoint ?? resolveHelperEntrypoint(deps.fileExists ?? fs.existsSync);
    const helperCwd = deps.helperCwd ?? path.resolve(path.dirname(helperEntrypoint), "../..");
    const spawnImpl = deps.spawnImpl ?? ((command, args, options) => spawn(command, args, options));
    const debugLogging = deps.debugLogging ?? defaultConfig.debugLogging;

    debugLog(debugLogging, "Helper unavailable, starting helper automatically...");

    const child = spawnImpl(deps.processExecPath ?? process.execPath, [helperEntrypoint], {
      cwd: helperCwd,
      detached: true,
      stdio: "ignore",
      env: process.env
    });

    child.unref();

    await waitForHelperReachable(config, {
      fetchImpl: deps.fetchImpl,
      child,
      healthcheckTimeoutMs: deps.healthcheckTimeoutMs,
      startupTimeoutMs: deps.startupTimeoutMs,
      pollIntervalMs: deps.pollIntervalMs
    });

    debugLog(debugLogging, "Helper auto-started successfully");
  })().finally(() => {
    if (helperStartupPromise === startupAttempt) {
      helperStartupPromise = null;
    }
  });

  helperStartupPromise = startupAttempt;
  return helperStartupPromise;
}

export async function isHelperReachable(
  config: Pick<PresenceConfig, "serverHost" | "serverPort"> = defaultConfig,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = HELPER_HEALTHCHECK_TIMEOUT_MS
): Promise<boolean> {
  const url = `http://${config.serverHost}:${config.serverPort}/health`;

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function isHelperUnavailableError(error: unknown): boolean {
  const patterns = ["fetch failed", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "socket hang up"];
  const seen = new Set<unknown>();
  let current = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);

    const message = current instanceof Error ? current.message : String(current);
    const code = "code" in current && typeof (current as { code?: unknown }).code === "string" ? (current as { code: string }).code : "";

    if (patterns.some((pattern) => message.includes(pattern) || code.includes(pattern))) {
      return true;
    }

    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }

  if (typeof error === "string") {
    return patterns.some((pattern) => error.includes(pattern));
  }

  return false;
}

export function resetHelperAutostartForTests(): void {
  helperStartupPromise = null;
}

function resolveHelperEntrypoint(fileExists: (path: string) => boolean): string {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "../..");
  const helperEntrypoint = path.resolve(packageRoot, "dist/cli/run-helper.js");

  if (!fileExists(helperEntrypoint)) {
    throw new Error(`Helper entrypoint not found at ${helperEntrypoint}. Run npm run build before using auto-start in a local checkout.`);
  }

  return helperEntrypoint;
}

async function waitForHelperReachable(
  config: Pick<PresenceConfig, "serverHost" | "serverPort">,
  options: {
    fetchImpl?: typeof fetch;
    child: Pick<ChildProcess, "once">;
    healthcheckTimeoutMs?: number;
    startupTimeoutMs?: number;
    pollIntervalMs?: number;
  }
): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const healthcheckTimeoutMs = options.healthcheckTimeoutMs ?? HELPER_HEALTHCHECK_TIMEOUT_MS;
  const startupTimeoutMs = options.startupTimeoutMs ?? HELPER_STARTUP_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? HELPER_STARTUP_POLL_MS;

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    let settled = false;

    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    const succeed = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    options.child.once("error", (error) => {
      fail(error);
    });

    const poll = async () => {
      if (settled) {
        return;
      }

      if (await isHelperReachable(config, fetchImpl, healthcheckTimeoutMs)) {
        succeed();
        return;
      }

      if (Date.now() - startedAt >= startupTimeoutMs) {
        fail(new Error(`Timed out waiting for helper to start on ${config.serverHost}:${config.serverPort}`));
        return;
      }

      setTimeout(() => {
        void poll();
      }, pollIntervalMs);
    };

    void poll();
  });
}

function debugLog(enabled: boolean, message: string, ...details: unknown[]): void {
  if (!enabled) {
    return;
  }

  console.log(`${LOG_PREFIX} ${message}`, ...details);
}
