import { isUserMessage, isVisibleAssistantMessage, textContent } from "../api/stateMapper";
import type { GraphMessage } from "../types/langgraph";
import { ResearchMarkdown } from "./ResearchMarkdown";
import { DownloadResearchNoteButton } from "./DownloadResearchNoteButton";

export function ConversationPanel({ messages, notes, completed }: { messages?: GraphMessage[]; notes?: Record<string, string>; completed: boolean }) {
  const visible = messages?.filter((message) => isUserMessage(message) || isVisibleAssistantMessage(message)) ?? [];
  return <section className="conversation">
    {visible.length ? visible.map((message, index) => {
      const userMessage = isUserMessage(message);
      const content = textContent(message.content);
      return <article className={`message ${userMessage ? "user" : "assistant"}`} key={message.id ?? index}>
        <div className="message-label">{userMessage ? "研究问题" : "司法案例研究结果"}</div>
        <div className="message-content">{userMessage ? content : <ResearchMarkdown content={content} />}</div>
      </article>;
    }) : <div className="empty conversation-empty">这里将显示与司法案例研究 Agent 的真实对话和最终研究结论。</div>}
    {completed ? <DownloadResearchNoteButton notes={notes} /> : null}
  </section>;
}
