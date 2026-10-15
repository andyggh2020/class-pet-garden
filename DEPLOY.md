# 班级宠物园 · 新服务器部署指南

## 架构说明

```
浏览器 → Nginx(80/443) → Node 服务(:3002)
                          ├─ /pet-garden/api/*  → 后端 API
                          ├─ /api/*             → 后端 API（兼容）
                          ├─ /assets /fonts 等   → 前端静态资源（dist/）
                          └─ 其余路径            → SPA index.html
                       Node → MySQL(classpets)
```

- 单个 Node 进程同时提供 API 和前端页面（`dist/` 由 `server/index.js` 托管），**不需要单独部署前端**
- PM2 守护进程名：`class-pet-garden-api`
- 数据库表结构由程序自动创建（首次启动自动建表 + 补列 + 初始化演示数据）

## 一、环境要求

| 组件 | 版本 | 说明 |
|---|---|---|
| Node.js | **≥ 20** | 使用 ESM 与 `--env-file`，低版本会报错 |
| MySQL | 5.7+ / 8.0 | 需 utf8mb4 |
| PM2 | 最新 | `npm i -g pm2` |
| Nginx | 任意 | 反向代理 + HTTPS（可选但推荐） |

## 二、安装步骤

### 1. 安装 Node / PM2（如未装）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v          # 应 ≥ v20
npm i -g pm2
```

### 2. 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE classpets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'classpets'@'127.0.0.1' IDENTIFIED BY '换成你的强密码';
CREATE USER 'classpets'@'localhost' IDENTIFIED BY '换成你的强密码';
GRANT ALL PRIVILEGES ON classpets.* TO 'classpets'@'127.0.0.1';
GRANT ALL PRIVILEGES ON classpets.* TO 'classpets'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 拉取代码

```bash
cd /www/wwwroot            # 换成你的目录
git clone https://github.com/andyggh2020/class-pet-garden.git
cd class-pet-garden
```

### 4. 安装依赖（**两份**：前端 + 后端）

```bash
npm install                # 项目根：前端构建依赖
cd server && npm install   # 后端运行依赖
cd ..
```

### 5. 配置生产环境变量

```bash
# 生成 TOKEN_SECRET（务必执行，不要手打）
openssl rand -hex 32

cat > server/.env.prod <<'EOF'
NODE_ENV=production
PORT=3002

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=classpets
DB_PASSWORD=换成你的强密码
DB_NAME=classpets
DB_CONNECTION_LIMIT=10

# 上一步 openssl 生成的随机串；生产必填，且一旦启用【永不更改】
TOKEN_SECRET=粘贴openssl生成的随机串

# 首次启动自动创建管理员 admin 的初始密码（之后请立即登录修改）
ADMIN_DEFAULT_PASSWORD=设置一个管理员初始密码

DEMO_RESET_TIMEZONE=Asia/Shanghai
EOF

chmod 600 server/.env.prod
```

### 6. 构建前端（在**项目根**执行）

```bash
npm run build              # 产出 dist/
```

### 7. 启动服务

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                # 按输出提示执行，实现开机自启
```

## 三、Nginx 配置

### 方案 A：域名专用于本站（推荐，配置最简单）

```nginx
server {
    listen 80;
    server_name yourdomain.com;          # 换成你的域名

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

访问 `http://yourdomain.com/` 即为销售页，`/app` 为工作台，`/admin` 为管理后台。

### 方案 B：部署在子路径 /pet-garden（服务器根路径已被其他应用占用时）

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 应用主体（页面 + API）
    location /pet-garden {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端构建产物中的绝对路径静态资源（vite base 为 /，需一并代理）
    location /assets/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
    }
    location /fonts/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
    }
    # public 目录下的图片（产品截图、插画、收款码占位图等）
    location ~ ^/(class-pet-garden-product|companion-effect-crop|wechat-pay-qrcode)\.(png|jpg|webp)$ {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
    }
}
```

访问 `http://yourdomain.com/pet-garden/`。HTTPS 用 certbot 或宝塔证书即可，代理规则不变。

## 四、部署后验证

```bash
pm2 logs class-pet-garden-api        # 应看到：
                                     # 🚀 Server running on http://localhost:3002
                                     # 📦 已启用前端静态资源托管
                                     # 🌻 已创建演示数据…
curl http://127.0.0.1:3002/api/health
```

浏览器检查：

| 页面 | 地址 | 预期 |
|---|---|---|
| 销售页 | `/` 或 `/pet-garden/` | 首页正常，FAQ/套餐展示 |
| 教师工作台 | `/app` 或 `/pet-garden/app` | 演示班级可体验 |
| 管理后台 | `/admin` 或 `/pet-garden/admin` | admin 登录（初始密码 = `ADMIN_DEFAULT_PASSWORD`） |

**管理员首次登录后请立即在「教师资料 → 账号设置 → 修改密码」。**

## 五、日常运维

```bash
# 更新版本（代码有更新时）
git pull
npm install                  # 依赖有变动才需要
npm run build                # 前端必须重新构建
pm2 restart class-pet-garden-api

# 查看日志
pm2 logs class-pet-garden-api --lines 100

# 数据备份（两种方式任选）
# 1) 管理后台「数据备份」按钮：下载全站 JSON
# 2) MySQL：mysqldump -u classpets -p classpets > backup_$(date +%F).sql
```

## 六、注意事项

1. **`TOKEN_SECRET` 永不更改**——更改后所有已登录用户掉线，且历史令牌全部失效
2. **`ADMIN_DEFAULT_PASSWORD` 仅在首次创建 admin 时生效**，改密码请登录后在后台操作
3. `server/public/uploads/` 需对运行用户可写（收款码、客服二维码上传位置），PM2 默认用当前用户，通常无需处理
4. MySQL 用户权限只需 `classpets.*`，不要给全局权限
5. 防火墙/安全组只放行 80/443；**3002 不要对公网开放**（仅 Nginx 内部访问）
6. 重复启动不会重复初始化：建表用 `IF NOT EXISTS`，列缺失自动迁移，演示数据已存在则跳过
7. 限流默认开启（注册 1 次/小时、登录 10 次/分钟），本地调试可在 `.env` 设 `AUTH_RATE_LIMIT_ENABLED=false`
8. 忘记密码验证码目前走**开发环境打印**（`pm2 logs` 可见），正式运营前需接短信通道
