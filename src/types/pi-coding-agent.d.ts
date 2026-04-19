declare module "@mariozechner/pi-coding-agent" {
  export interface Model<T = unknown> {
    provider: string;
    id: string;
  }

  export interface SessionStartEvent {
    type: "session_start";
    reason: "startup" | "reload" | "new" | "resume" | "fork";
    previousSessionFile?: string;
  }

  export interface SessionShutdownEvent {
    type: "session_shutdown";
  }

  export interface ModelSelectEvent {
    type: "model_select";
    model: Model;
    previousModel: Model | undefined;
    source: "set" | "cycle" | "restore";
  }

  export interface AgentStartEvent {
    type: "agent_start";
  }

  export interface AgentEndEvent {
    type: "agent_end";
    messages: unknown[];
  }

  export interface ToolExecutionStartEvent {
    type: "tool_execution_start";
    toolCallId: string;
    toolName: string;
    args: unknown;
  }

  export interface ToolExecutionEndEvent {
    type: "tool_execution_end";
    toolCallId: string;
    toolName: string;
    result: unknown;
    isError: boolean;
  }

  export interface ReadonlySessionManagerLike {
    getSessionId(): string;
    getSessionFile(): string | undefined;
  }

  export interface ExtensionContext {
    cwd: string;
    model: Model | undefined;
    sessionManager: ReadonlySessionManagerLike;
  }

  export interface ExtensionAPI {
    on(event: "session_start", handler: (event: SessionStartEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "session_shutdown", handler: (event: SessionShutdownEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "model_select", handler: (event: ModelSelectEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "agent_start", handler: (event: AgentStartEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "agent_end", handler: (event: AgentEndEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "tool_execution_start", handler: (event: ToolExecutionStartEvent, ctx: ExtensionContext) => void | Promise<void>): void;
    on(event: "tool_execution_end", handler: (event: ToolExecutionEndEvent, ctx: ExtensionContext) => void | Promise<void>): void;
  }
}
