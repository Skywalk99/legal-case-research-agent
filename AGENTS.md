AGENTS.md
1. Project Overview

This repository contains a LangGraph-based Chinese legal research agent.

The backend is already functional and should be treated as the source of truth.

The project currently contains:

Main Agent for planning, delegation, and task monitoring
SubAgent for legal research execution
Chinese court case retrieval tools
Case detail retrieval tools
Research notes and cross-task memory
Summary generation
LangGraph local API server

The project is being extended with an independent web frontend.

2. Core Architecture
Main Agent

Responsibilities:

Understand the user's legal research request
Create research plans
Delegate concrete research tasks to the SubAgent
Monitor task progress
Update task status
Return the final result

The Main Agent should not directly perform detailed legal case research.

SubAgent

Responsibilities:

Execute concrete legal research tasks
Query previous research notes when necessary
Search Chinese court cases
Retrieve specific case details
Analyze facts, legal grounds, court reasoning, and outcomes
Save research results to notes
Legal Tools

Important backend tools include:

search_legal_cases
get_case_detail
query_note
write_note
update_note
ls

Do not replace these real tools with frontend mock implementations.

3. Backend Is the Source of Truth

The existing LangGraph backend has already been tested successfully.

Do not rebuild or duplicate the Agent logic in the frontend.

The frontend must consume real backend data.

The frontend must NOT:

simulate Agent responses
hard-code research plans
hard-code legal cases
hard-code research results
implement fake case retrieval
recreate the Main Agent logic
recreate the SubAgent logic

The frontend is a client of the backend, not an alternative Agent implementation.

4. Backend API

Local backend server:

http://localhost:8000

Important API endpoints currently used:

POST /threads
POST /threads/{thread_id}/runs/stream

The /docs page is available at:

http://localhost:8000/docs

The frontend should use the backend API rather than LangGraph Studio.

5. LangGraph Studio

LangGraph Studio is a development/debugging interface.

It is NOT the business backend.

Do not copy Studio UI logic into the frontend.

Do not make the application dependent on LangSmith Studio.

The backend Graph should remain usable independently of Studio.

The frontend should communicate directly with the local LangGraph API.

6. Graph

The current production graph entry should remain a normal graph builder function.

Recommended graph identifier:

legal_research

Do not introduce frontend-specific graph logic.

The Graph should remain reusable by:

LangGraph local server
LangGraph Studio
custom frontend
future API clients
7. State

Important backend state includes concepts such as:

messages
plan
note
task_messages
SubAgent temporary task messages
legal API call counters

Do not remove or rename existing State fields unless explicitly requested.

The frontend may display backend state, but should not become responsible for maintaining backend Agent state.

8. Legal API and Security

The legal research backend uses external APIs.

API keys are backend secrets.

Never expose:

MOONSHOT_API_KEY
DEEPSEEK_API_KEY
DASHSCOPE_API_KEY
DELI_API_KEY
any other provider secret

to frontend JavaScript, browser local storage, URL parameters, or bundled frontend code.

The browser should communicate only with the backend.

Do not move legal API calls into the frontend.

9. Cost and Tool-Call Constraints

The project intentionally limits expensive legal API calls.

Current SubAgent constraints include:

search_legal_cases: maximum 1 call per subtask
get_case_detail: maximum 3 different case IDs per subtask
duplicate case detail retrieval should be prevented

Do not remove or bypass these controls.

Do not introduce frontend behavior that automatically starts multiple runs for one user request.

Do not retry expensive backend operations without explicit user action or safe retry logic.

10. Frontend Architecture

The frontend should be an independent application.

Preferred stack:

React
Vite
TypeScript

Frontend local development server:

http://localhost:5173

However, inspect the repository before creating or selecting technologies.

The frontend should be organized into clear layers, such as:

UI components
pages
API client/service layer
streaming/SSE handling
state management
TypeScript types
configuration

Do not place backend business logic inside React components.

11. Frontend and Backend Integration

The frontend must use real LangGraph API responses.

Expected flow:

User submits a legal question

→ create a thread

→ store the returned thread_id

→ call the graph run streaming endpoint

→ process streaming events

→ update UI state

→ display the final assistant result

The frontend should correctly handle:

metadata events
values/state events
heartbeat events
run completion
errors
cancellation
reconnect behavior
duplicate submissions

Do not assume the streaming response is ordinary JSON.

12. Frontend Product Direction

The frontend is intended to be a legal research workspace, not merely a generic chat application.

The UI should eventually support:

Research Plan

Display real plan state:

pending
in_progress
done
Conversation

Display:

user questions
assistant responses
research progress
Case Information

Display real case data obtained from the backend, such as:

title
court
case number
judgement date
cause
case type
case ID
relevant case details
Research Notes

Display research results produced by the backend when appropriate.

All displayed information should originate from actual backend state or tool results.

13. Modification Safety

The existing backend has already been tested.

Prefer incremental changes.

Before modifying backend code:

Determine whether the same goal can be achieved entirely in the frontend.
If not, make the smallest backend change necessary.
Explain why the backend change is required.
Verify that existing Agent behavior still works.

Avoid unnecessary refactoring.

Do not rewrite working backend components merely for stylistic reasons.

14. Testing Requirements

Every meaningful frontend/backend integration change should be tested against the real backend.

Do not rely exclusively on mocked API responses.

At minimum, test:

frontend starts
backend starts
frontend can create a thread
frontend can start a real graph run
streaming events are received
plan updates are displayed correctly
final assistant response is displayed
case information comes from real legal retrieval
errors are displayed correctly
API secrets are not exposed
15. Change Review

When modifying this repository:

inspect the existing code first
understand data flow before changing code
preserve working behavior
prefer minimal changes
verify actual integration
report what was changed
report what was tested
report anything that could not be verified

Never claim a feature works unless it was actually tested.

16. Development Principle

The project should follow this architecture:

Browser
↓
Frontend (http://localhost:5173)
↓
LangGraph API (http://localhost:8000)
↓
Main Agent
↓
SubAgent
↓
Legal Tools / External APIs

The frontend must remain a client of the backend.

The backend remains responsible for:

Agent reasoning
task planning
legal retrieval
case analysis
notes
API credentials
tool-call limits
final research results