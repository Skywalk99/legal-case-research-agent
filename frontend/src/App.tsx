import { casesFromState } from "./api/stateMapper";
import { CasePanel } from "./components/CasePanel";
import { ConversationPanel } from "./components/ConversationPanel";
import { ResearchComposer } from "./components/ResearchComposer";
import { ResearchPlanPanel } from "./components/ResearchPlanPanel";
import { useLegalResearchRun } from "./hooks/useLegalResearchRun";
import "./styles.css";

const phaseText = { idle: "就绪", creating_thread: "正在创建研究会话", running: "正在研究", completed: "研究完成", error: "研究失败", cancelled: "已取消" };

export default function App() {
  const research = useLegalResearchRun();
  const cases = casesFromState(research.state);
  return <main className="workspace">
    <header className="topbar"><div><p className="eyebrow">CHINA LEGAL CASE RESEARCH AGENT</p><h1>中国司法案例研究智能体</h1></div><div className={`status status-${research.phase}`}>{phaseText[research.phase]}{research.threadId ? <small>Thread: {research.threadId.slice(0, 8)}…{research.lastHeartbeat ? " · SSE 已连接" : ""}</small> : null}</div></header>
    {research.error ? <div className="error-banner" role="alert">后端返回错误：{research.error}</div> : null}
    <div className="workspace-grid">
      <ResearchPlanPanel plan={research.state.plan} />
      <section className="center-panel"><ConversationPanel messages={research.state.messages} notes={research.state.note} completed={research.phase === "completed"} /><ResearchComposer phase={research.phase} onSubmit={research.submit} onCancel={research.cancel} /></section>
      <CasePanel cases={cases} notes={research.state.note} />
    </div>
  </main>;
}
