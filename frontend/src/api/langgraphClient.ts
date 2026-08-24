import { parseSseStream } from "./sseParser";
import type { ResearchState, SseEvent, ThreadResponse } from "../types/langgraph";

const apiBase = import.meta.env.VITE_LANGGRAPH_API_BASE_URL ?? "/api";
const graphId = "legal_search";
const recursionLimit = 50;

async function apiError(response: Response): Promise<Error> {
  let detail = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    detail = typeof body?.detail === "string" ? body.detail : JSON.stringify(body);
  } catch { /* use status text */ }
  return new Error(detail);
}

export async function createThread(): Promise<ThreadResponse> {
  const response = await fetch(`${apiBase}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw await apiError(response);
  return response.json() as Promise<ThreadResponse>;
}

export async function getThreadState(threadId: string): Promise<ResearchState> {
  const response = await fetch(`${apiBase}/threads/${threadId}/state`);
  if (!response.ok) throw await apiError(response);
  const payload = await response.json();
  return payload.values ?? payload;
}

export async function* streamResearch(
  threadId: string,
  question: string,
  signal: AbortSignal,
): AsyncGenerator<SseEvent> {
  const response = await fetch(`${apiBase}/threads/${threadId}/runs/stream`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      assistant_id: graphId,
      config: { recursion_limit: recursionLimit },
      input: { messages: [{ type: "human", content: question }] },
      stream_mode: ["values", "updates"],
      stream_subgraphs: true,
      stream_resumable: true,
      on_disconnect: "continue",
      multitask_strategy: "reject",
    }),
  });
  if (!response.ok) throw await apiError(response);
  yield* parseSseStream(response);
}

export async function cancelRun(threadId: string, runId: string): Promise<void> {
  const response = await fetch(
    `${apiBase}/threads/${threadId}/runs/${runId}/cancel?action=interrupt`,
    { method: "POST" },
  );
  if (!response.ok && response.status !== 202) throw await apiError(response);
}
