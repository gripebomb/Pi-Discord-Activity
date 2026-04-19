import { z } from "zod";

export const activityStateSchema = z.enum(["starting", "thinking", "tooling", "editing", "idle", "error"]);

export const presencePayloadSchema = z.object({
  app: z.literal("pi-coding-agent"),
  provider: z.string().min(1).default("unknown"),
  model: z.string().min(1).default("unknown"),
  state: activityStateSchema.default("idle"),
  projectName: z.string().optional(),
  startedAt: z.number().int().positive(),
  sessionId: z.string().min(1).optional(),
  privacyMode: z.boolean().default(true)
});

export type ActivityState = z.infer<typeof activityStateSchema>;
export type PresencePayload = z.infer<typeof presencePayloadSchema>;
