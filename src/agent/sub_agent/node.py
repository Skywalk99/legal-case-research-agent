from typing import Literal, cast

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_dev_utils import (
    has_tool_calling,
    load_chat_model,
    message_format,
    parse_tool_calling,
)
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime
from langgraph.types import Command

from src.agent.sub_agent.state import SubAgentState
from src.agent.tools import (
    #get_weather,
    query_note,
    # tavily_search,
    write_note,
    search_legal_cases,
    get_case_detail
)
from src.agent.utils.context import Context


async def subagent_call_model(
    state: SubAgentState,
) -> Command[Literal["sub_tools", "write_and_summary", "__end__"]]:
    run_time = get_runtime(Context)
    if isinstance(state["messages"][-1], AIMessage):
        last_ai_message = state["messages"][-1]
    else:
        last_ai_message = cast(AIMessage, state["messages"][-2])

    _, args = parse_tool_calling(last_ai_message, first_tool_call_only=True)
    task_name = cast(dict, args).get("content", "")

    model = load_chat_model(model=run_time.context.sub_model).bind_tools(
        [query_note, write_note,search_legal_cases,get_case_detail]  #tavily_search
    )

    messages = state.get("temp_task_messages", [])

    notes = state.get("note", {})

    user_requirement = state["messages"][0].content

    response = await model.ainvoke(
        [
            SystemMessage(
                content=run_time.context.sub_prompt.format(
                    task_name=task_name,
                    history_files=message_format(list(notes.keys()))
                    if notes
                    else "当前没有笔记",
                    user_requirement=user_requirement,
                )
            ),
            HumanMessage(content=f"我的任务是：{task_name}，请帮我完成"),
            *messages,
        ]
    )
    if has_tool_calling(cast(AIMessage, response)):

        name, tool_args = parse_tool_calling(
            cast(AIMessage, response),
            first_tool_call_only=True,
        )

        # ============================================================
        # 1. search_legal_cases：每个子任务最多 1 次
        # ============================================================
        if name == "search_legal_cases":

            search_count = state.get(
                "legal_search_count",
                0,
            )

            if search_count >= 1:
                return Command(
                    goto="subagent_call_model",
                    update={
                        "temp_task_messages": [
                            HumanMessage(
                                content=(
                                    "本子任务已经完成过一次案例检索，"
                                    "不能再次调用 search_legal_cases。"
                                    "请直接基于已经获得的案例检索结果继续分析。"
                                )
                            )
                        ]
                    },
                )

            return Command(
                goto="sub_tools",
                update={
                    "temp_task_messages": [response],
                    "legal_search_count": search_count + 1,
                },
            )

        # ============================================================
        # 2. get_case_detail：最多 3 个不同案例
        # ============================================================
        if name == "get_case_detail":

            detail_count = state.get(
                "case_detail_count",
                0,
            )

            case_detail_ids = state.get(
                "case_detail_ids",
                [],
            )

            tool_args = cast(dict, tool_args)

            case_id = tool_args.get("case_id", "")

            # --------------------------------------------------------
            # 情况 A：没有传 case_id
            # --------------------------------------------------------
            if not case_id:
                return Command(
                    goto="subagent_call_model",
                    update={
                        "temp_task_messages": [
                            HumanMessage(
                                content=(
                                    "get_case_detail 缺少 case_id。"
                                    "请使用 search_legal_cases 返回结果中的 "
                                    "case_id，再调用 get_case_detail。"
                                )
                            )
                        ]
                    },
                )

            # --------------------------------------------------------
            # 情况 B：这个案例之前已经获取过详情
            # --------------------------------------------------------
            if case_id in case_detail_ids:
                return Command(
                    goto="subagent_call_model",
                    update={
                        "temp_task_messages": [
                            HumanMessage(
                                content=(
                                    f"案例 {case_id} 已经获取过详细文书，"
                                    "不要重复调用 get_case_detail。"
                                    "请基于已有案例详情继续分析，"
                                    "或者选择其他尚未获取详情的案例。"
                                )
                            )
                        ]
                    },
                )

            # --------------------------------------------------------
            # 情况 C：已经达到 3 个案例的上限
            # --------------------------------------------------------
            if detail_count >= 3:
                return Command(
                    goto="subagent_call_model",
                    update={
                        "temp_task_messages": [
                            HumanMessage(
                                content=(
                                    "本子任务已经获取了 3 个不同案例的详细裁判文书，"
                                    "已达到 get_case_detail 的调用上限。"
                                    "请基于已有案例详情完成分析，"
                                    "不要继续调用 get_case_detail。"
                                )
                            )
                        ]
                    },
                )

            # --------------------------------------------------------
            # 情况 D：允许调用
            # --------------------------------------------------------
            return Command(
                goto="sub_tools",
                update={
                    "temp_task_messages": [response],
                    "case_detail_count": detail_count + 1,
                    "case_detail_ids": [
                        *case_detail_ids,
                        case_id,
                    ],
                },
            )

        # ============================================================
        # 3. write_note：进入总结节点
        # ============================================================
        if name == "write_note":
            return Command(
                goto="write_and_summary",
                update={
                    "temp_task_messages": [response],
                },
            )

        # ============================================================
        # 4. 其他普通工具
        # ============================================================
        return Command(
            goto="sub_tools",
            update={
                "temp_task_messages": [response],
            },
        )

    return Command(
        goto="__end__",
        update={
            "task_messages": [*messages, response],
        },
    )


sub_tools = ToolNode(
    [
        query_note,
        search_legal_cases,
        get_case_detail,
    ],
    messages_key="temp_task_messages",
)
#     if has_tool_calling(cast(AIMessage, response)):
#         name, _ = parse_tool_calling(
#             cast(AIMessage, response), first_tool_call_only=True
#         )
#
#         if name == "search_legal_cases":
#             search_count = state.get("legal_search_count", 0)
#
#             if search_count >= 1:
#                 # 已经检索过，不允许再次调用 API
#                 return Command(
#                     goto="subagent_call_model",
#                     update={
#                         "temp_task_messages": [
#                             response,
#                             HumanMessage(
#                                 content=(
#                                     "search_legal_cases 本子任务已经调用过一次。"
#                                     "请不要重复检索，请基于已有检索结果继续分析，"
#                                     "如需深入研究具体案例，请使用 get_case_detail。"
#                                 )
#                             ),
#                         ],
#                     },
#                 )
#
#             return Command(
#                 goto="sub_tools",
#                 update={
#                     "temp_task_messages": [response],
#                     "legal_search_count": search_count + 1,
#                 },
#             )
#
#         if name == "get_case_detail":
#             detail_count = state.get("case_detail_count", 0)
#
#             if detail_count >= 3:
#                 return Command(
#                     goto="subagent_call_model",
#                     update={
#                         "temp_task_messages": [
#                             response,
#                             HumanMessage(
#                                 content=(
#                                     "get_case_detail 已达到本子任务的调用上限（3次）。"
#                                     "请基于已经获取的案例详情完成分析，不要继续调用该工具。"
#                                 ),
#                             ),
#                         ],
#                     },
#                 )
#
#             return Command(
#                 goto="sub_tools",
#                 update={
#                     "temp_task_messages": [response],
#                     "case_detail_count": detail_count + 1,
#                 },
#             )
#
#         if name == "write_note":
#             return Command(
#                 goto="write_and_summary",
#                 update={"temp_task_messages": [response]},
#             )
#         else:
#             return Command(
#                 goto="sub_tools",
#                 update={"temp_task_messages": [response]},
#             )
#
#     return Command(
#         goto="__end__",
#         update={
#             "task_messages": [*messages, response],
#         },
#     )
#
#
# sub_tools = ToolNode(
#     [query_note,search_legal_cases,get_case_detail], messages_key="temp_task_messages"
# )
# #tavily_search,