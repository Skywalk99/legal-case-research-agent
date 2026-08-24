export type PlanStatus = "pending" | "in_progress" | "done";

export interface PlanItem {
  content: string;
  status: PlanStatus;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface GraphMessage {
  id?: string;
  type?: string;
  role?: string;
  content: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ResearchState {
  messages?: GraphMessage[];
  plan?: PlanItem[];
  note?: Record<string, string>;
  task_messages?: GraphMessage[];
  temp_task_messages?: GraphMessage[];
  [key: string]: unknown;
}

export interface ThreadResponse {
  thread_id: string;
  status: string;
  values?: ResearchState;
}

export interface SseEvent {
  event: string;
  data: unknown;
  id?: string;
}

export interface CaseSummary {
  case_id?: string;
  title?: string;
  court?: string;
  case_number?: string;
  judgement_date?: string;
  cause?: string;
  case_type?: string;
  sections?: Array<{ section?: string; text?: string }>;
}
