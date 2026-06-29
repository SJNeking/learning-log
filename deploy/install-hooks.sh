#!/bin/bash
# install-hooks.sh — 安装 Learning Log git hooks
# 所有 AI 代理（opencode/Claude Code/Cline/ProxyAI）提交后自动记录阶段
set -euo pipefail

HOOKS_DIR="$(cd "$(dirname "$0")/.." && pwd)/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📎 安装 git hooks → $HOOKS_DIR"

for hook in post-commit post-checkout; do
    src="$SCRIPT_DIR/hooks/$hook"
    dst="$HOOKS_DIR/$hook"
    if [ -f "$src" ]; then
        cp "$src" "$dst"
        chmod +x "$dst"
        echo "  ✅ $hook"
    fi
done

echo "  完成"
