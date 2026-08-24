import type { SseEvent } from "../types/langgraph";

export async function* parseSseStream(response: Response): AsyncGenerator<SseEvent> {
  if (!response.body) throw new Error("服务器未返回可读取的 SSE 流。");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "message";
  let id: string | undefined;
  let data: string[] = [];

  const emit = (): SseEvent | undefined => {
    if (!data.length) return undefined;
    const raw = data.join("\n");
    let parsed: unknown = raw;
    try { parsed = JSON.parse(raw); } catch { /* non-JSON server payload */ }
    const result = { event, data: parsed, id };
    event = "message";
    id = undefined;
    data = [];
    return result;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = done ? "" : lines.pop() ?? "";

      for (const line of lines) {
        if (line === "") {
          const parsed = emit();
          if (parsed) yield parsed;
          continue;
        }
        if (line.startsWith(":")) {
          if (line.slice(1).trim() === "heartbeat") yield { event: "heartbeat", data: null };
          continue;
        }
        const colon = line.indexOf(":");
        const field = colon === -1 ? line : line.slice(0, colon);
        const valuePart = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
        if (field === "event") event = valuePart;
        if (field === "id") id = valuePart;
        if (field === "data") data.push(valuePart);
      }
      if (done) break;
    }
    const parsed = emit();
    if (parsed) yield parsed;
  } finally {
    reader.releaseLock();
  }
}
