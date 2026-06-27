#!/bin/bash
# ── Learning Log 服务安装脚本 ──
# 将前后端安装为 macOS LaunchAgent，实现：
#   - 开机自启
#   - 崩溃自动重启
#   - 后台静默运行
#   - 关闭 PyCharm/终端 不受影响

set -e

PROJECT_DIR="$HOME/PycharmProjects/learning-log"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
RUNTIME_DIR="$HOME/.learning-log"

INSTALL_MCP=false
if [[ "$1" == "--with-mcp" ]]; then
    INSTALL_MCP=true
fi

echo "🔧 Learning Log 持久化服务安装"
echo "================================"
echo ""

# 确保运行时目录存在
mkdir -p "$RUNTIME_DIR"

# 确保脚本可执行
chmod +x "$PROJECT_DIR/deploy/run-backend.sh"
chmod +x "$PROJECT_DIR/deploy/run-frontend.sh"
chmod +x "$PROJECT_DIR/deploy/run-mcp.sh"

# 卸载旧版本（如果存在）
echo "📦 清理旧服务..."
launchctl unload "$LAUNCH_AGENTS_DIR/com.learning-log.backend.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/com.learning-log.frontend.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/com.learning-log.mcp.plist" 2>/dev/null || true

# 复制 plist 到 LaunchAgents 目录
echo "📋 安装 plist 文件..."
cp "$PROJECT_DIR/deploy/com.learning-log.backend.plist" "$LAUNCH_AGENTS_DIR/"
cp "$PROJECT_DIR/deploy/com.learning-log.frontend.plist" "$LAUNCH_AGENTS_DIR/"

# 加载服务
echo "🚀 启动服务..."
launchctl load "$LAUNCH_AGENTS_DIR/com.learning-log.backend.plist"
launchctl load "$LAUNCH_AGENTS_DIR/com.learning-log.frontend.plist"

if [ "$INSTALL_MCP" = true ]; then
    cp "$PROJECT_DIR/deploy/com.learning-log.mcp.plist" "$LAUNCH_AGENTS_DIR/"
    launchctl load "$LAUNCH_AGENTS_DIR/com.learning-log.mcp.plist"
fi

echo ""
echo "⏳ 等待服务就绪..."
sleep 3

# 验证
MCP_PORT=8010
echo ""
echo "📊 验证服务状态..."

check_backend() {
    curl -s http://localhost:8002/api/stats > /dev/null 2>&1
}

check_frontend() {
    curl -s http://localhost:3000 > /dev/null 2>&1
}

check_mcp() {
    curl -s -o /dev/null -w '%{http_code}' http://localhost:$MCP_PORT/sse 2>/dev/null | grep -q '200'
}

if check_backend; then
    echo "   ✅ 后端 (8002) — 运行中"
    STATS=$(curl -s http://localhost:8002/api/stats)
    echo "      记录: $(echo $STATS | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("entries","?"))') 条"
else
    echo "   ⚠️  后端 (8002) — 启动中，查看日志: tail -f $RUNTIME_DIR/backend.log"
fi

if check_frontend; then
    echo "   ✅ 前端 (3000) — 运行中"
else
    echo "   ⚠️  前端 (3000) — 启动中（首次 npm run dev 较慢），查看日志: tail -f $RUNTIME_DIR/frontend.log"
fi

if [ "$INSTALL_MCP" = true ]; then
    sleep 2
    if check_mcp; then
        echo "   ✅ MCP (${MCP_PORT}) — 运行中"
        echo "      配置: { \"type\": \"sse\", \"url\": \"http://localhost:${MCP_PORT}/sse\" }"
    else
        echo "   ⚠️  MCP (${MCP_PORT}) — 启动中，查看日志: tail -f $RUNTIME_DIR/mcp.log"
    fi
fi

echo ""
echo "✅ 安装完成！"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  🎉 Learning Log 现在将持续在后台运行       │"
echo "│  关闭 PyCharm / 终端 不会影响服务            │"
echo "│  系统重启后自动恢复                          │"
echo "│                                             │"
echo "│  前端: http://localhost:3000                 │"
echo "│  后端: http://localhost:8002/docs            │"

MCP_LINE="│  MCP:  http://localhost:${MCP_PORT}/sse"
if [ "$INSTALL_MCP" = true ]; then
    echo "$MCP_LINE                │"
fi
echo "│                                             │"
echo "│  管理命令:                                   │"
echo "│    learnlog service status   查看状态        │"
echo "│    learnlog service restart  重启服务        │"
echo "│    learnlog service uninstall 卸载服务       │"
echo "│    learnlog service logs     查看日志        │"
echo "└─────────────────────────────────────────────┘"
