#!/bin/bash
# ── Learning Log MCP SSE Server 启动脚本 ──
# 以 HTTP/SSE 模式运行 MCP Server，供任意 MCP 客户端连接

set -e

PROJECT_DIR="${LEARNLOG_PROJECT_DIR:-$HOME/PycharmProjects/learning-log}"
MCP_PORT="${LEARNLOG_MCP_PORT:-8010}"
PYTHON="${VENV_PYTHON:-$(command -v python3)}"

cd "$PROJECT_DIR"
exec "$PYTHON" "$PROJECT_DIR/backend/mcp_server.py" --sse --port "$MCP_PORT"
