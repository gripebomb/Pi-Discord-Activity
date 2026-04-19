import path from "node:path";
import type {
  AgentEndEvent,
  AgentStartEvent,
  ExtensionAPI,
  ExtensionContext,
  ModelSelectEvent,
  SessionShutdownEvent,
  SessionStartEvent,
  ToolExecutionEndEvent,
  ToolExecutionStartEvent
} from "@mariozechner/pi-coding-agent";
import type { ActivityState, PresencePayload } from "../shared/types.js";
import { PresenceState } from "./state.js";
import { ensureHelperRunning, isHelperUnavailableError } from "./helper.js";
import { publishPresence } from "./transport.js";

const LOG_PREFIX = "[pi-discord-activity]";
const EDITING_TOOLS = new Set(["edit", "write"]);
const DEBUG_LOGGING = process.env.PI_PRESENCE_DEBUG === "true";

export default function (pi: ExtensionAPI): void {
  const state = new PresenceState();
  let agentActive = false;
  let lastPublishedKey: string | null = null;

  const publishCurrent = async (reason: string) => {
    const payload = state.snapshot();
    const publishKey = JSON.stringify(payload);

    if (publishKey === lastPublishedKey) {
      return;
    }

    lastPublishedKey = publishKey;

    try {
      await publishPresence(payload);
      log(reason, payloadSummary(payload));
      return;
    } catch (error) {
      if (!isHelperUnavailableError(error)) {
        console.error(`${LOG_PREFIX} Failed to publish presence for ${reason}`, error);
        return;
      }
    }

    try {
      await ensureHelperRunning();
      await publishPresence(payload);
      log(`${reason}:autostart`, payloadSummary(payload));
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to publish presence for ${reason}`, error);
    }
  };

  pi.on("session_start", async (event: SessionStartEvent, ctx: ExtensionContext) => {
    agentActive = false;

    state.startSession({
      sessionId: getSessionId(ctx),
      projectName: getProjectName(ctx),
      provider: ctx.model?.provider,
      model: ctx.model?.id,
      startedAt: Math.floor(Date.now() / 1000),
      state: "starting"
    });

    try {
      await ensureHelperRunning();
    } catch (error) {
      log("helper_autostart_failed", { error: error instanceof Error ? error.message : String(error) });
    }

    log("session_start", {
      reason: event.reason,
      sessionId: getSessionId(ctx),
      model: ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "unknown"
    });

    await publishCurrent("session_start");
  });

  pi.on("model_select", async (event: ModelSelectEvent) => {
    state.update({
      provider: event.model.provider,
      model: event.model.id
    });

    log("model_select", {
      source: event.source,
      previousModel: event.previousModel ? `${event.previousModel.provider}/${event.previousModel.id}` : "none",
      model: `${event.model.provider}/${event.model.id}`
    });

    await publishCurrent("model_select");
  });

  pi.on("agent_start", async (_event: AgentStartEvent) => {
    agentActive = true;
    state.setActivity("thinking");
    log("agent_start", { state: "thinking" });
    await publishCurrent("agent_start");
  });

  pi.on("tool_execution_start", async (event: ToolExecutionStartEvent) => {
    const activity = mapToolToActivity(event.toolName);
    state.setActivity(activity);
    log("tool_execution_start", { toolName: event.toolName, state: activity });
    await publishCurrent("tool_execution_start");
  });

  pi.on("tool_execution_end", async (event: ToolExecutionEndEvent) => {
    const nextState: ActivityState = event.isError ? "error" : agentActive ? "thinking" : "idle";
    state.setActivity(nextState);
    log("tool_execution_end", { toolName: event.toolName, isError: event.isError, state: nextState });
    await publishCurrent("tool_execution_end");
  });

  pi.on("agent_end", async (_event: AgentEndEvent) => {
    agentActive = false;
    state.setActivity("idle");
    log("agent_end", { state: "idle" });
    await publishCurrent("agent_end");
  });

  pi.on("session_shutdown", async (_event: SessionShutdownEvent) => {
    agentActive = false;
    state.setActivity("idle");
    log("session_shutdown", { state: "idle" });
    await publishCurrent("session_shutdown");
  });
}

function mapToolToActivity(toolName: string): ActivityState {
  return EDITING_TOOLS.has(toolName) ? "editing" : "tooling";
}

function getSessionId(ctx: ExtensionContext): string | undefined {
  return ctx.sessionManager.getSessionId() || ctx.sessionManager.getSessionFile();
}

function getProjectName(ctx: ExtensionContext): string | undefined {
  const base = path.basename(ctx.cwd);
  return base && base !== "." ? base : undefined;
}

function payloadSummary(payload: PresencePayload) {
  return {
    sessionId: payload.sessionId,
    provider: payload.provider,
    model: payload.model,
    state: payload.state,
    privacyMode: payload.privacyMode
  };
}

function log(event: string, details: Record<string, unknown>): void {
  if (!DEBUG_LOGGING) {
    return;
  }

  console.log(`${LOG_PREFIX} ${event}`, details);
}
