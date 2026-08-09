@echo off
chcp 65001 >nul
title 教育管理系统 - 后端一键启动

echo ============================================
echo   教育管理系统 - 后端一键启动
echo ============================================
echo.

rem 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    echo 安装完成后请重开终端再运行本脚本
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [1/3] Node.js 版本: %NODE_VER%

cd /d "%~dp0"
echo [2/3] 切换到 web 目录: %cd%

rem 安装依赖（首次运行较慢）
if not exist "node_modules" (
    echo 首次运行，正在安装依赖，请耐心等待...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请查看上方日志
        pause
        exit /b 1
    )
) else (
    echo [3/3] 依赖已安装
)

echo.
echo 正在重建数据库（建表 + 灌入初始数据）...
call npm run db:reset
if %errorlevel% neq 0 (
    echo [错误] 数据库重建失败
    pause
    exit /b 1
)

echo.
echo --------------------------------------------
echo  数据库已就绪！
echo  内置账号:
echo    admin           / Eamon_20141027@admin   (管理员)
echo    li.teacher2024  / Edu@2024#Secure      (教师)
echo    wang.teacher2024/ Teach@2024#Pass     (教师)
echo --------------------------------------------
echo.
echo 即将启动后端服务（监听 http://localhost:3000）
echo  看到 "Local: http://localhost:3000" 表示启动成功
echo  请保持本窗口打开，关闭则后端停止
echo.
pause

call npm run dev
