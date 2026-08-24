$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"

uv run langgraph dev `
    --host 127.0.0.1 `
    --port 8000 `
    --allow-blocking `
    --no-browser
