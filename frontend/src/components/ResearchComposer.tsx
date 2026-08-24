import { FormEvent, useState } from "react";
import type { RunPhase } from "../hooks/useLegalResearchRun";

export function ResearchComposer({ phase, onSubmit, onCancel }: { phase: RunPhase; onSubmit: (question: string) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState("");
  const working = phase === "creating_thread" || phase === "running";
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(question); };
  return <form className="composer" onSubmit={submit}>
    <textarea value={question} onChange={(event) => setQuestion(event.target.value)} disabled={working} placeholder="输入需要研究的中国司法案例、案情或争议焦点，例如：检索并分析商标侵权中“混淆可能性”的相关司法案例" rows={3} />
    <div className="composer-actions">
      <span>{working ? "Agent 正在基于真实后端状态研究…" : "每次提交只会启动一个后端 run"}</span>
      {working ? <button type="button" className="secondary" onClick={onCancel}>取消研究</button> : <button type="submit" disabled={!question.trim()}>开始研究</button>}
    </div>
  </form>;
}
