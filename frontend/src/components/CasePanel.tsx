import type { CaseSummary } from "../types/langgraph";

export function CasePanel({ cases, notes }: { cases: CaseSummary[]; notes?: Record<string, string> }) {
  return <section className="panel material-panel">
    <div className="panel-heading"><span>案例 / 研究资料</span><small>来自工具与 State</small></div>
    <div className="materials">
      <h3>检索案例</h3>
      {cases.length ? cases.map((item, index) => <article className="case-card" key={item.case_id ?? item.case_number ?? index}>
        <strong>{item.title ?? "未命名案例"}</strong>
        <dl>
          {item.court && <><dt>法院</dt><dd>{item.court}</dd></>}
          {item.case_number && <><dt>案号</dt><dd>{item.case_number}</dd></>}
          {item.judgement_date && <><dt>日期</dt><dd>{item.judgement_date}</dd></>}
          {item.cause && <><dt>案由</dt><dd>{item.cause}</dd></>}
        </dl>
        {item.sections?.length ? <details><summary>已取得文书详情</summary>{item.sections.map((section, i) => <p key={i}><b>{section.section}</b><br />{section.text}</p>)}</details> : null}
      </article>) : <p className="empty">真实案例检索结果将在这里出现。</p>}
      <h3>研究笔记</h3>
      {notes && Object.keys(notes).length ? Object.entries(notes).map(([name, content]) => <details className="note" key={name}><summary>{name}</summary><pre>{content}</pre></details>) : <p className="empty">SubAgent 保存的司法案例研究笔记将在这里出现。</p>}
    </div>
  </section>;
}
