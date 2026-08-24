import type { PlanItem } from "../types/langgraph";

const symbol = { done: "✓", in_progress: "●", pending: "○" };

export function ResearchPlanPanel({ plan }: { plan?: PlanItem[] }) {
  return <section className="panel plan-panel">
    <div className="panel-heading"><span>研究计划</span><small>来自 Agent State</small></div>
    {plan?.length ? <ol className="plan-list">
      {plan.map((item) => <li key={item.content} className={`plan-${item.status}`}>
        <span aria-hidden>{symbol[item.status]}</span><span>{item.content}</span>
      </li>)}
    </ol> : <p className="empty">提交研究问题后，Agent 制定的真实计划会显示在这里。</p>}
  </section>;
}
