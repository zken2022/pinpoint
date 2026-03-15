@echo off
chcp 65001 >nul
echo 🔍 检查环境依赖...

REM 检查package.json是否存在
if not exist "package.json" (
    echo ❌ 错误: package.json 文件不存在
    pause
    exit /b 1
)

REM 检查node_modules目录是否存在
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装成功
) else (
    echo ✅ 依赖已存在
)

REM 检查.env.local文件是否存在
if not exist ".env.local" (
    echo 📄 创建.env.local文件...
    echo # GEMINI_API_KEY: Required for Gemini AI API calls.> .env.local
    echo # AI Studio automatically injects this at runtime from user secrets.>> .env.local
    echo # Users configure this via the Secrets panel in the AI Studio UI.>> .env.local
    echo GEMINI_API_KEY="" >> .env.local
    echo. >> .env.local
    echo # APP_URL: The URL where this applet is hosted.>> .env.local
    echo # AI Studio automatically injects this at runtime with the Cloud Run service URL.>> .env.local
    echo # Used for self-referential links, OAuth callbacks, and API endpoints.>> .env.local
    echo APP_URL="http://localhost:3000" >> .env.local
    echo ✅ .env.local文件创建成功
)

echo 🚀 启动开发服务器...
start "图钉开发服务器" cmd /k "npm run dev"

echo 🌐 打开浏览器...
start http://localhost:3000

echo ✅ 一键启动完成！
echo ℹ️  开发服务器已启动，浏览器已打开
pause