@echo off
chcp 65001 >nul
rem 一键启动：本地服务器 + 自动打开校园食堂信息系统
rem 使用方法：双击本文件；关闭弹出的命令行窗口即停止服务

where python >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 python 命令。请先安装 Python，或在 VS Code 中改用 Live Server 插件。
  pause
  exit /b 1
)

cd /d "%~dp0.."
echo 正在启动本地服务器 http://localhost:8123 （关闭本窗口即可停止）...
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8123/canteen/index.html"
python -m http.server 8123
