from typing import Annotated
from langchain_core.messages import AnyMessage
from src.agent.state import State
from langgraph.graph.message import add_messages


class SubAgentState(State):
    temp_task_messages: Annotated[list[AnyMessage], add_messages]
    # 每个子任务最多进行一次案例搜索
    legal_search_count: int

    # 每个子任务最多获取 3 个不同案例的详情
    case_detail_count: int

    # 已经获取过详情的 case_id，防止同一个案例重复调用
    case_detail_ids: list[str]