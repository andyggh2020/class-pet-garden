# 班级宠物园 · Windows 服务器 + 宝塔面板 部署指南

> 本文是 **DEPLOY.md（Linux 版）** 的 Windows + 宝塔专用补充。宝塔负责三件事：**Nginx 反向代理、MySQL 数据库、防火墙**；Node 服务用 PM2 守护。前端 `dist/` 由 Node 服务直接托管，**不需要单独部署前端**。

## 架构

```
浏览器 → 宝塔 Nginx(80/443) → 127.0.0.1:3002（Node：API + 前端页面）
                        → 宝塔 MySQL(classpets)
```

## 0. 前置检查

宝塔「软件商店 / 已安装」确认装了 **Nginx** 和 **MySQL**；Node 是否在 PATH（在宝塔终端或 PowerShell 跑）：

```powershell
node -v        # 必须 ≥ v20，否则去宝塔“软件商店”装“Node 版本管理器”选 20.x
npm -v
```

> 若 `node` 提示找不到：说明宝塔装的 Node 没进系统 PATH，或你还没装 Node。最省事是去 nodejs.org 下载 **LTS 安装包**直接装（会自动加 PATH），装完**重开终端**。

## 1. 宝塔建数据库

宝塔面板 → **数据库** → 添加数据库：

| 项 | 值 |
|---|---|
| 数据库名 | `classpets` |
| 用户名 | `classpets` |
| 密码 | 自己设一个强密码 |
| 访问权限 | **所有人**（本地服务连接需要） |

记下 **库名 / 用户名 / 密码**，第 4 步要用。**不用手动建表**——程序首次启动自动建。

## 2. 放代码

推荐放宝塔默认站点目录（如 `D:\wwwroot`）。两种方式任选：

**方式 A：git 拉取（服务器需装 Git）**
```powershell
cd D:\wwwroot
git clone https://github.com/andyggh2020/class-pet-garden.git
```

**方式 B：本地打包上传**
把项目打包成 zip，宝塔「文件」上传到 `D:\wwwroot` 后解压（注意要包含 `server/` 子目录和根目录的 `package.json`）。

## 3. 装依赖 + 构建（注意两份依赖 + PowerShell 不用 `&&`）

```powershell
cd D:\wwwroot\class-pet-garden
npm install
cd server
npm install
cd ..
npm run build
```

> 报错先看有没有 `node -v`（第 0 步）。`npm install` 在根目录装前端构建依赖，`server` 目录装后端运行依赖，**两份缺一不可**。

## 4. 写生产配置

```powershell
notepad D:\wwwroot\class-pet-garden\server\.env.prod
```

粘贴（替换 4 处：数据库密码、TOKEN_SECRET、管理员初始密码）：

```
NODE_ENV=production
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=classpets
DB_PASSWORD=第1步设的密码
DB_NAME=classpets
DB_CONNECTION_LIMIT=10
TOKEN_SECRET=粘贴下面命令生成的随机串
ADMIN_DEFAULT_PASSWORD=管理员初始密码
DEMO_RESET_TIMEZONE=Asia/Shanghai
```

生成 TOKEN_SECRET（PowerShell 里执行）：
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 5. 启动服务（PM2）

```powershell
npm i -g pm2
cd D:\wwwroot\class-pet-garden
pm2 start ecosystem.config.cjs
pm2 save
```

看到 `🚀 Server running on http://localhost:3002` + `📦 已启用前端静态资源托管` 即成功。

**开机自启**（Windows 版 `pm2 startup` 不可用，二选一）：
```powershell
# 方式 A：PM2 官方 Windows 启动器
npm i -g pm2-windows-startup
pm2-windows-startup install

# 方式 B：宝塔「计划任务」里加“开机执行” → 命令填 `pm2 resurrect`
```

> 别和宝塔“PM2 管理器”插件混用，两套 PM2 会互相看不到进程。推荐命令行这套（和 Linux 服务器行为完全一致）。

## 6. 宝塔 Nginx 反向代理

宝塔面板 → **网站** → 添加站点（填域名，没有域名就填服务器公网 IP）→ 进入站点 → **反向代理**：

| 配置项 | 值 |
|---|---|
| 代理名称 | `/` |
| 目标 URL | `http://127.0.0.1:3002` |
| 发送域名 | `$host` |
| 目录 | **留空**（留空才是全站代理，连 /assets、/fonts、/api 一起转给 3002） |

保存后 Nginx 自动重载。访问 `http://你的域名或IP/` 即销售页。

> 如果你一定要挂在子路径（如 `/pet-garden`），代理目录填 `/pet-garden/`，目标 `http://127.0.0.1:3002`，并为 `/assets/`、`/fonts/` 再各加一条同名代理。简单起见建议直接主域名根路径反代。

## 7. 防火墙

宝塔面板 → **安全** → 放行 **80**（和 443 如果要 HTTPS）。**3002 不要对外开放**，只给本机 Nginx 用。

## 8. 验证清单

```powershell
pm2 list                                   # 应显示 class-pet-garden-api online
curl http://127.0.0.1:3002/api/health     # 应返回 200
```

浏览器检查：

| 页面 | 地址 |
|---|---|
| 销售页 | `http://服务器IP/` |
| 工作台 | `http://服务器IP/app` |
| 管理后台 | `http://服务器IP/admin`（admin + 第 4 步的密码） |

**管理员首次登录后请立即改密码**：教师资料 → 账号设置 → 修改密码。

## 注意事项

1. **`TOKEN_SECRET` 永不更改**——改了所有已登录用户掉线，历史令牌全部失效
2. **两份 `npm install`**——根目录 + `server/` 各一次
3. **`npm run build` 在项目根跑**，不在 `server/` 里
4. **PowerShell 没有 `&&`**——命令换行写，或用 `;`
5. **MySQL 访问权限选“所有人”**——最省事，避免 127.0.0.1/localhost 名义差异
6. **宝塔自带 Node 版本可能 <20**——务必 `node -v` 确认，不够就用“Node 版本管理器”装 20+
7. **别混用两套 PM2**——命令行全局 PM2 优先
8. **上传目录要可写**——`server/public/uploads/` 是收款码/客服码存放处，默认当前用户有权限
9. 忘记密码验证码目前走**开发环境打印**（`pm2 logs` 可见），正式运营前需接短信通道

## 日常更新代码

```powershell
cd D:\wwwroot\class-pet-garden
git pull
npm install                  # 依赖有变动才需要
npm run build                # 前端必须重新构建
pm2 restart class-pet-garden-api
```
