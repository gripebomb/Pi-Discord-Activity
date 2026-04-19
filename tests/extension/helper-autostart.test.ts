import test from "node:test";
import assert from "node:assert/strict";
import { ensureHelperRunning, isHelperReachable, isHelperUnavailableError, resetHelperAutostartForTests } from "../../src/extension/helper.js";

test.afterEach(() => {
  resetHelperAutostartForTests();
});

test("isHelperUnavailableError recognizes helper transport failures", () => {
  assert.equal(isHelperUnavailableError(new TypeError("fetch failed")), true);
  assert.equal(isHelperUnavailableError({ message: "request failed", cause: { code: "ECONNREFUSED" } }), true);
  assert.equal(isHelperUnavailableError(new Error("something else")), false);
});

test("isHelperReachable returns true when helper health endpoint responds", async () => {
  const reachable = await isHelperReachable(
    { serverHost: "127.0.0.1", serverPort: 42666 },
    (async () => new Response(null, { status: 204 })) as typeof fetch,
    25
  );

  assert.equal(reachable, true);
});

test("ensureHelperRunning spawns the helper once and waits for readiness", async () => {
  const spawnCalls: Array<{ command: string; args: readonly string[]; cwd: string }> = [];
  let probeCount = 0;

  await Promise.all([
    ensureHelperRunning(
      { serverHost: "127.0.0.1", serverPort: 42666, autostartHelper: true },
      {
        helperEntrypoint: "/tmp/pi-discord-activity/dist/cli/run-helper.js",
        helperCwd: "/tmp/pi-discord-activity",
        processExecPath: "/usr/bin/node",
        fetchImpl: (async () => {
          probeCount += 1;
          if (probeCount < 3) {
            throw new TypeError("fetch failed");
          }
          return new Response(null, { status: 204 });
        }) as typeof fetch,
        spawnImpl: ((command, args, options) => {
          spawnCalls.push({ command, args, cwd: options.cwd });
          return {
            once() {
              return this;
            },
            unref() {}
          };
        }) as any,
        healthcheckTimeoutMs: 10,
        startupTimeoutMs: 100,
        pollIntervalMs: 1,
        debugLogging: false
      }
    ),
    ensureHelperRunning(
      { serverHost: "127.0.0.1", serverPort: 42666, autostartHelper: true },
      {
        helperEntrypoint: "/tmp/pi-discord-activity/dist/cli/run-helper.js",
        helperCwd: "/tmp/pi-discord-activity",
        processExecPath: "/usr/bin/node",
        fetchImpl: (async () => new Response(null, { status: 204 })) as typeof fetch,
        spawnImpl: ((command, args, options) => {
          spawnCalls.push({ command, args, cwd: options.cwd });
          return {
            once() {
              return this;
            },
            unref() {}
          };
        }) as any,
        healthcheckTimeoutMs: 10,
        startupTimeoutMs: 100,
        pollIntervalMs: 1,
        debugLogging: false
      }
    )
  ]);

  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].command, "/usr/bin/node");
  assert.deepEqual(spawnCalls[0].args, ["/tmp/pi-discord-activity/dist/cli/run-helper.js"]);
  assert.equal(spawnCalls[0].cwd, "/tmp/pi-discord-activity");
});

test("ensureHelperRunning respects autostart opt-out", async () => {
  let spawned = false;

  await ensureHelperRunning(
    { serverHost: "127.0.0.1", serverPort: 42666, autostartHelper: false },
    {
      spawnImpl: (() => {
        spawned = true;
        return {
          once() {
            return this;
          },
          unref() {}
        };
      }) as any,
      fetchImpl: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
      debugLogging: false
    }
  );

  assert.equal(spawned, false);
});
