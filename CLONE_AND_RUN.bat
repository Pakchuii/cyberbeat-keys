@echo off
chcp 65001 >nul
title CyberBeat Keys - 快速启动向导
echo =======================================================
echo          ⚡ CyberBeat Keys 开源快速启动向导
echo =======================================================
echo.

if not exist node_modules (
    echo [1/2] 正在首次安装依赖项 (npm install)...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请确保已安装 Node.js (v18+)
        pause
        exit /b 1
    )
) else (
    echo [1/2] 依赖项已就绪！
)

echo.
echo [2/2] 正在启动 CyberBeat Keys...
call npm start

pause
