#!/usr/bin/env python3
"""
MCP Manager — Learning Log MCP SSE Server 管理工具
==================================================
安装/卸载/查看 MCP Server 作为 macOS launchd 持久化服务。

用法:
  python3 mcp_manager.py install     安装 MCP 持久化服务
  python3 mcp_manager.py uninstall   卸载 MCP 服务
  python3 mcp_manager.py status      查看 MCP 服务状态
  python3 mcp_manager.py start       前台启动 MCP (调试用)
"""
import os
import sys
import subprocess
import argparse

PROJECT_DIR = os.environ.get(
    "LEARNLOG_PROJECT_DIR",
    os.path.expanduser("~/PycharmProjects/learning-log")
)
LAUNCH_AGENTS_DIR = os.path.expanduser("~/Library/LaunchAgents")
MCP_PLIST = os.path.join(LAUNCH_AGENTS_DIR, "com.learning-log.mcp.plist")
MCP_PORT = int(os.environ.get("LEARNLOG_MCP_PORT", "8010"))
MCP_SCRIPT = os.path.join(PROJECT_DIR, "deploy", "run-mcp.sh")
MCP_PLIST_SRC = os.path.join(PROJECT_DIR, "deploy", "com.learning-log.mcp.plist")


def _run(cmd, capture=True):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return -1, "", str(e)


def cmd_install():
    """安装 MCP 为 launchd 持久化服务"""
    print(f"🔌 安装 MCP 持久化服务 (端口 {MCP_PORT})...")
    print()

    # 确保脚本可执行
    _run(f"chmod +x {MCP_SCRIPT}")

    if not os.path.exists(MCP_PLIST_SRC):
        print(f"❌ plist 源文件不存在: {MCP_PLIST_SRC}")
        sys.exit(1)

    # 卸载旧版本
    _run(f"launchctl unload {MCP_PLIST}", capture=False)
    # 复制 plist
    _run(f"cp {MCP_PLIST_SRC} {MCP_PLIST}")
    # 加载服务
    code, _, err = _run(f"launchctl load {MCP_PLIST}")
    if code == 0:
        print(f"   ✅ MCP 服务已安装并启动")
        print()
        print(f"   📋 SSE 端点: http://localhost:{MCP_PORT}/sse")
        print(f"   📋 客户端配置:")
        print(f"      {{ \"type\": \"sse\", \"url\": \"http://localhost:{MCP_PORT}/sse\" }}")
        print()
        print(f"   📝 日志: tail -f ~/.learning-log/mcp.log")
    else:
        print(f"   ❌ 安装失败: {err}")
        sys.exit(1)


def cmd_uninstall():
    """卸载 MCP 持久化服务"""
    print("🗑️  卸载 MCP 持久化服务...")
    if os.path.exists(MCP_PLIST):
        _run(f"launchctl unload {MCP_PLIST}", capture=False)
        os.remove(MCP_PLIST)
        print("   ✅ MCP 服务已卸载")
    else:
        print("   ⏭️  MCP 服务未安装")


def cmd_status():
    """查看 MCP 服务状态"""
    print("🔌 MCP SSE Server 状态")
    print("=" * 40)

    mcp_loaded = os.path.exists(MCP_PLIST)
    if mcp_loaded:
        code, out, _ = _run("launchctl list com.learning-log.mcp")
        if code == 0 and "com.learning-log.mcp" in out:
            print("   launchd: ✅ 已加载")
            # 提取 PID
            parts = out.split()
            if len(parts) >= 3:
                print(f"   PID:     {parts[0] if parts[0] != '-' else '?'}")
        else:
            print("   launchd: ❌ 未加载")
    else:
        print("   launchd: ❌ 未安装")

    # 检查 SSE 端点
    code, out, _ = _run(
        f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{MCP_PORT}/sse 2>/dev/null"
    )
    if '200' in out:
        print(f"   SSE:     ✅ http://localhost:{MCP_PORT}/sse")
    else:
        print(f"   SSE:     ❌ 无响应")

    print()
    print("📋 客户端配置（其他 AI 代理使用此地址接入）:")
    print(f'   {{ "type": "sse", "url": "http://localhost:{MCP_PORT}/sse" }}')


def cmd_start():
    """前台启动 MCP Server (调试用)"""
    print(f"🔌 启动 MCP SSE Server (端口 {MCP_PORT})...")
    os.execvp("bash", ["bash", MCP_SCRIPT])


def main():
    parser = argparse.ArgumentParser(
        description="MCP Manager — Learning Log MCP SSE Server 管理"
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("install", help="安装 MCP 为 launchd 持久化服务")
    sub.add_parser("uninstall", help="卸载 MCP 持久化服务")
    sub.add_parser("status", help="查看 MCP 服务状态")
    sub.add_parser("start", help="前台启动 MCP Server (调试用)")

    args = parser.parse_args()

    if args.command == "install":
        cmd_install()
    elif args.command == "uninstall":
        cmd_uninstall()
    elif args.command == "status":
        cmd_status()
    elif args.command == "start":
        cmd_start()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
