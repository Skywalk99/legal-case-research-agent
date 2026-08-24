from typing import Annotated
import httpx
from dotenv import load_dotenv
import os
from langchain_core.tools import tool
# 从项目根目录加载 .env（确保 .env 和项目根目录同级）
load_dotenv()
DELI_API_KEY = os.getenv("DELI_API_KEY")
from langchain_tavily.tavily_search import TavilySearch

from langchain_dev_utils import (
    create_update_note_tool,
    create_write_note_tool,
    create_write_plan_tool,
    create_update_plan_tool,
    create_ls_tool,
    create_query_note_tool,
)

write_plan = create_write_plan_tool(
    name="write_plan",
    description="""用于写入计划的工具,只能使用一次，在最开始的时候使用，后续请使用update_plan更新。
参数：
plan: list[str], 待写入的计划列表，这是一个字符串列表，每个字符串都是一个计划内容content
""",
)

update_plan = create_update_plan_tool(
    name="update_plan",
    description="""用于更新计划的工具，可以多次使用来更新计划进度。
    参数：
    update_plans: list[Todo] - 需要更新的计划列表，每个元素是一个包含以下字段的字典：
        - content: str, 计划内容，必须与现有计划内容完全一致
        - status: str, 计划状态，只能是"in_progress"（进行中）或"done"（已完成）

    使用说明：
    1. 每次调用只需传入需要更新状态的计划，无需传入所有计划
    2. 必须同时包含至少一个"done"状态的计划和至少一个"in_progress"状态的计划
        - 将已完成的计划设置为"done"
        - 将接下来要执行的计划设置为"in_progress"
    3. content字段必须与现有计划内容精确匹配

    示例：
    假设当前计划列表为：
    [
        {"content":"计划1"，"status":"done"}
        {"content":"计划2"，"status":"in_progress"}
        {"content":"计划3"，"status":"pending"}
    ]
    当完成"计划1"并准备开始"计划2"时，应传入：
    [
        {"content":"计划1", "status":"done"},
        {"content":"计划2", "status":"in_progress"}
    ]
    """,
)

ls = create_ls_tool(
    name="ls",
    description="""用于列出所有已保存的笔记名称。

    返回：
    list[str]: 包含所有笔记文件名的列表

    """,
)

query_note = create_query_note_tool(
    name="query_note",
    description="""用于查询笔记。

    参数：
    file_name:笔记名称

    返回：
    str, 查询的笔记内容

    """,
)

write_note = create_write_note_tool(
    name="write_note",
    description="""用于写入笔记的工具。

    参数：
    content: str, 笔记内容

    """,
    message_key="temp_task_messages",
)

update_note = create_update_note_tool(
    name="update_note",
    description="""用于更新笔记的工具。

    参数：
    file_name: str, 笔记名称
    orignal_content: str, 笔记原始内容
    new_content: str, 笔记更新后的内容
    """,
    message_key="temp_task_messages",
)


@tool
async def transfor_task_to_subagent(
    content: Annotated[
        str,
        "当前待执行的todo任务内容，必须与todo列表中待办事项的content字段完全一致，但是当子智能体执行的任务有误时，重试的时候可以适当改写",
    ],
):
    """用于执行todo任务的工具。

    参数：
    content: str, 待执行的todo任务内容，必须与todo列表中待办事项的content字段完全一致，但是当子智能体执行的任务有误时，重试的时候可以适当改写

    例如当前的todo list是
    [
        {"content":"待办1"，"status":"done"}
        {"content":"待办2"，"status":"in_progress"}
        {"content":"待办3"，"status":"pending"}

    ]
    则可以知道当前执行的是待办2，则输入的content应该为"待办2"。
    """

    return "transfor success!"


#@tool
# def get_weather(city: str):
#     """查询天气。
#
#     参数：
#     city:城市名称
#
#     返回：
#     str, 天气信息
#
#     """
#     return f"{city}的天气是晴天，温度是25度。"

@tool
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result

@tool
async def search_legal_cases(
    query: Annotated[
        str,
        "需要检索的中国法律问题、案情描述或争议焦点，例如：上班途中发生交通事故是否构成工伤",
    ],
):
    """
    检索中国法院裁判案例。

    适用场景：
    - 用户需要寻找中国法院的相关案例
    - 用户需要进行类案检索
    - 用户需要了解某个法律问题的司法裁判实践
    - 用户需要寻找与当前案件相似的裁判文书

    query 应当描述具体的法律问题、案情或争议焦点，
    不要只输入非常宽泛的关键词。

    每个研究任务原则上只调用一次。
    如果已经获得足够的案例，不要重复调用。
    """

    if not DELI_API_KEY:
        raise ValueError(
            "DELI_API_KEY 未配置，请在 .env 文件中设置。"
        )

    url = "https://platform.delilegal.com/api/v1/generice/case/list"

    headers = {
        "authorization": f"Bearer {DELI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "query": query,
        "pageNo": 1,
        "pageSize": 10,
        "sortField": "correlation",
        "sortOrder": "desc",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    result = response.json()

    if not result.get("success"):
        raise RuntimeError(
            f"得理案例检索失败: {result.get('msg', '未知错误')}"
        )

    body = result.get("body", {})

    cases = body.get("data", [])

    # 不把无关的 API 元数据全部塞给 LLM
    return {
        "query_id": body.get("queryId"),
        "total_count": body.get("totalCount"),
        "total_page": body.get("totalPage"),
        "cases": [
            {
                "title": case.get("title"),
                "court": case.get("court"),
                "case_number": case.get("caseNumber"),
                "judgement_date": case.get("judgementDate"),
                "case_type": case.get("caseType"),
                "cause": case.get("cause"),
                "judgement_type": case.get("judgementType"),
                "level_of_trial": case.get("levelOfTrial"),
                "publish_type": case.get("publishTypeName"),
                "case_id": case.get("id"),
            }
            for case in cases
        ],
    }


@tool
async def get_case_detail(
        case_id: Annotated[str, "案例唯一标识，从 search_legal_cases 结果的 case_id 字段获取"],
):
    """
    获取单个裁判案例的详细内容。
    当需要深入研究某个具体案例的完整文书时再调用。
    """

    if not DELI_API_KEY:
        raise ValueError("DELI_API_KEY 未配置")

    url = f"https://platform.delilegal.com/api/v1/generice/case/info/{case_id}"

    headers = {
        "authorization": f"Bearer {DELI_API_KEY}",
        "Host": "platform.delilegal.com",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    result = response.json()
    if not result.get("success"):
        raise RuntimeError(f"案例详情获取失败: {result.get('msg', '未知错误')}")

    body = result.get("body", {})

    # ✅ 优先返回结构化的 docResult，LLM 比看大段纯文本更清晰
    doc_result = body.get("docResult", [])

    # 如果 docResult 为空，降级用 caseDetailContent
    content_sections = doc_result or [{"label": "全文", "text": body.get("caseDetailContent", "")}]

    return {
        "title": body.get("title"),
        "case_number": body.get("caseNumber"),
        "court": body.get("court"),
        "judgement_date": body.get("judgementDate"),
        "cause": body.get("cause"),
        "case_type": body.get("caseType"),
        "level_of_trial": body.get("levelOfTria"),
        "judge_jury": body.get("judgeJury", []),
        "sections": [
            {
                "section": sec.get("label"),
                "text": sec.get("text", "")[:3000],  # 每段截断，防止单段过长
            }
            for sec in content_sections
        ],
    }