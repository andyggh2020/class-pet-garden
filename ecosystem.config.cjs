const fs = require('fs')
const path = require('path')

// 读取 server/.env.prod（若存在），避免把密码写进配置文件
// 文件格式：一行一个 KEY=VALUE，# 开头为注释
function loadEnvFile(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  const content = fs.readFileSync(file, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/)
    if (!match) continue
    let value = (match[2] || '').trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
  return env
}

const fileEnv = loadEnvFile(path.join(__dirname, 'server', '.env.prod'))

module.exports = {
  apps: [
    {
      name: 'class-pet-garden-api',
      cwd: path.join(__dirname, 'server'),
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        // 数据库：按宝塔里实际创建的库名/用户名/密码，在 server/.env.prod 中覆盖
        DB_HOST: '127.0.0.1',
        DB_PORT: '3306',
        DB_USER: 'classpets',
        DB_PASSWORD: '',
        DB_NAME: 'classpets',
        DB_CONNECTION_LIMIT: '10',
        // 生产环境必填：TOKEN_SECRET（否则签发登录令牌会直接抛错）
        TOKEN_SECRET: '',
        // 首次启动自动创建的管理员 admin 的初始密码
        ADMIN_DEFAULT_PASSWORD: '',
        DEMO_RESET_TIMEZONE: 'Asia/Shanghai',
        // 上传的收款码等资源存放目录（相对 server/）
        ...fileEnv,
      },
    },
  ],
}
