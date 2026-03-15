Write-Host "🔍 检查环境依赖..." -ForegroundColor Cyan

# 检查package.json是否存在
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: package.json 文件不存在" -ForegroundColor Red
    Read-Host "按Enter键退出..."
    exit 1
}

# 检查node_modules目录是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按Enter键退出..."
        exit 1
    }
    Write-Host "✅ 依赖安装成功" -ForegroundColor Green
} else {
    Write-Host "✅ 依赖已存在" -ForegroundColor Green
}

# 检查.env.local文件是否存在
if (-not (Test-Path ".env.local")) {
    Write-Host "📄 创建.env.local文件..." -ForegroundColor Yellow
    $envContent = @'
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY=""

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="http://localhost:3000"
'@
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✅ .env.local文件创建成功" -ForegroundColor Green
}

Write-Host "🚀 启动开发服务器..." -ForegroundColor Cyan
# 启动开发服务器在新窗口
Start-Process "cmd.exe" -ArgumentList "/k npm run dev" -WindowStyle Normal -WorkingDirectory $PWD

Write-Host "🌐 打开浏览器..." -ForegroundColor Cyan
# 打开浏览器
Start-Process "http://localhost:3000"

Write-Host "✅ 一键启动完成！" -ForegroundColor Green
Write-Host "ℹ️  开发服务器已启动，浏览器已打开" -ForegroundColor Yellow
Read-Host "按Enter键退出..."