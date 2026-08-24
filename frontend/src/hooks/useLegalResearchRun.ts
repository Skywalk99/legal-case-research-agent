import { useCallback, useRef, useState } from "react";
import { cancelRun, createThread, getThreadState, streamResearch } from "../api/langgraphClient";
import type { ResearchState } from "../types/langgraph";

export type RunPhase = "idle" | "creating_thread" | "running" | "completed" | "error" | "cancelled";

export function useLegalResearchRun() {
  const [threadId, setThreadId] = useState<string>();
  const [runId, setRunId] = useState<string>();
  const [state, setState] = useState<ResearchState>({});
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [error, setError] = useState<string>();
  const [lastHeartbeat, setLastHeartbeat] = useState<number>();
  const abortRef = useRef<AbortController | undefined>(undefined);

  const submit = useCallback(async (question: string) => {
    if (!question.trim() || phase === "running" || phase === "creating_thread") return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(undefined);
    setRunId(undefined);

    try {
      let activeThreadId = threadId;
      if (!activeThreadId) {
        setPhase("creating_thread");
        const thread = await createThread();
        activeThreadId = thread.thread_id;
        setThreadId(activeThreadId);
        if (thread.values) setState(thread.values);
      }

      setPhase("running");
      for await (const event of streamResearch(activeThreadId, question.trim(), controller.signal)) {
        if (event.id) { /* kept by parser for future resumable-stream enhancement */ }
        if (event.event === "heartbeat") {
          setLastHeartbeat(Date.now());
        } else if (event.event === "metadata") {
          const value = event.data as { run_id?: string };
          if (value.run_id) setRunId(value.run_id);
        } else if (event.event === "values") {
          setState(event.data as ResearchState);
        } else if (event.event === "updates") {
          // Updates are intentionally not converted into synthetic user-visible replies.
          // The authoritative plan, messages, notes, and cases arrive in State values.
        } else if (event.event === "error") {
          throw new Error(typeof event.data === "string" ? event.data : JSON.stringify(event.data));
        }
      }
      const finalState = await getThreadState(activeThreadId);
      setState(finalState);
      setPhase("completed");
    } catch (reason) {
      if (controller.signal.aborted) {
        setPhase("cancelled");
      } else {
        setError(reason instanceof Error ? reason.message : "研究请求失败。");
        setPhase("error");
      }
    } finally {
      abortRef.current = undefined;
    }
  }, [phase, threadId]);

  const cancel = useCallback(async () => {
    if (!threadId || !runId) return;
    try {
      await cancelRun(threadId, runId);
      abortRef.current?.abort();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "取消研究失败。");
    }
  }, [runId, threadId]);

  return { threadId, runId, state, phase, error, lastHeartbeat, submit, cancel };
}
