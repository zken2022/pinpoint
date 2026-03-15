#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

console.log('🔍 检查环境依赖...');

// 检查package.json是否存在
if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
  console.error('❌ 错误: package.json 文件不存在');
  process.exit(1);
}

// 检查node_modules目录是否存在
if (!fs.existsSync(path.join(projectRoot, 'node_modules'))) {
  console.log('📦 正在安装依赖...');
  try {
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ 依赖安装成功');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ 依赖已存在');
}

// 检查.env.local文件是否存在
if (!fs.existsSync(path.join(projectRoot, '.env.local'))) {
  console.log('📄 创建.env.local文件...');
  const envContent = `# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY=""

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="http://localhost:3000"`;
  fs.writeFileSync(path.join(projectRoot, '.env.local'), envContent);
  console.log('✅ .env.local文件创建成功');
}

console.log('🚀 启动开发服务器...');

// 启动开发服务器
const devServer = spawn('npm.cmd', ['run', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// 等待服务器启动，然后打开浏览器
setTimeout(() => {
  console.log('🌐 打开浏览器...');
  try {
    if (process.platform === 'win32') {
      // Windows系统使用start命令，需要在shell中执行
      spawn('cmd.exe', ['/c', 'start', 'http://localhost:3000'], { stdio: 'ignore', shell: true });
    } else if (process.platform === 'darwin') {
      // macOS系统使用open命令
      spawn('open', ['http://localhost:3000'], { stdio: 'ignore' });
    } else {
      // Linux系统使用xdg-open命令
      spawn('xdg-open', ['http://localhost:3000'], { stdio: 'ignore' });
    }
  } catch (error) {
    console.error('❌ 打开浏览器失败:', error.message);
    console.log('ℹ️  请手动打开浏览器访问 http://localhost:3000');
  }
}, 5000);

devServer.on('error', (error) => {
  console.error('❌ 启动服务器失败:', error.message);
  process.exit(1);
});

devServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ 服务器异常退出，退出码: ${code}`);
    process.exit(code);
  }
});