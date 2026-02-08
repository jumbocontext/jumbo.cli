export interface SessionView {
  sessionId: string;
  focus: string | null; // Nullable - set at session end, not start
  status: "active" | "paused" | "blocked" | "ended";
  contextSnapshot: string | null;
  version: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
