import type { CaseSummary, GraphMessage, ResearchState } from "../types/langgraph";

export function textContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(textContent).join("\n");
  if (content && typeof content === "object") return JSON.stringify(content, null, 2);
  return "";
}

export function isUserMessage(message: GraphMessage): boolean {
  return message.type === "human" || message.role === "user";
}

export function isVisibleAssistantMessage(message: GraphMessage): boolean {
  return (message.type === "ai" || message.role === "assistant") && !(message.tool_calls?.length);
}

function parseObject(content: unknown): unknown {
  if (typeof content !== "string") return content;
  try { return JSON.parse(content); } catch { return undefined; }
}

function walk(value: unknown, found: CaseSummary[]): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((item) => walk(item, found)); return; }
  const item = value as Record<string, unknown>;
  if (typeof item.title === "string" && ("case_number" in item || "case_id" in item || "sections" in item)) {
    found.push(item as CaseSummary);
  }
  Object.values(item).forEach((child) => walk(child, found));
}

export function casesFromState(state: ResearchState): CaseSummary[] {
  const allMessages = [...(state.messages ?? []), ...(state.temp_task_messages ?? [])];
  const cases: CaseSummary[] = [];
  allMessages.forEach((message) => walk(parseObject(message.content), cases));
  const unique = new Map<string, CaseSummary>();
  cases.forEach((item) => unique.set(item.case_id ?? item.case_number ?? item.title ?? crypto.randomUUID(), item));
  return [...unique.values()];
}
