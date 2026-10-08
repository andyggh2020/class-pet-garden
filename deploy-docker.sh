#!/usr/bin/env bash
# 班级宠物园 —— 服务器一键部署脚本（Docker Compose）
#
# 用法：
#   bash deploy-docker.sh                  # 默认装到 /opt/class-pet-garden，对外端口 3002
#   APP_PORT=8080 bash deploy-docker.sh    # 自定义对外端口
#
# 前置条件：已安装 Docker 与 Docker Compose 插件
# （未安装时脚本会打印安装命令并退出）

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/class-pet-garden}"
APP_PORT="${APP_PORT:-3002}"
REPO="${REPO:-https://github.com/andyggh2020/class-pet-garden.git}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. Docker
log "1/6 检查 Docker 环境"
if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker。请先执行："
  echo "  curl -fsSL https://get.docker.com | bash"
  echo "  systemctl enable --now docker"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "未检测到 Docker Compose 插件。请先执行："
  echo "  apt-get update && apt-get install -y docker-compose-plugin   # Debian/Ubuntu"
  echo "  yum install -y docker-compose-plugin                          # CentOS/RHEL"
  exit 1
fi
echo "使用命令：$DC"

# ------------------------------------------------------- 2. Docker 镜像加速
log "2/6 配置 Docker 镜像加速（国内服务器建议开启）"
if [ ! -f /etc/docker/daemon.json ] && [ -d /etc/docker ] && [ "$(id -u)" -eq 0 ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://hub-mirror.c.163.com"
  ]
}
JSON
  systemctl restart docker 2>/dev/null || true
  sleep 3
  echo "已写入镜像加速器并重启 Docker"
else
  echo "跳过（daemon.json 已存在或非 root；如需加速请手动添加 registry-mirrors）"
fi

# ------------------------------------------------------------------ 3. 代码
log "3/6 获取代码到 $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  command -v git >/dev/null 2>&1 || { echo "未检测到 git，请先安装：apt-get install -y git"; exit 1; }
  git clone "$REPO" "$APP_DIR"
else
  echo "目录已存在，尝试拉取最新代码"
  git -C "$APP_DIR" pull --ff-only || echo "拉取失败，继续使用本地现有代码"
fi
cd "$APP_DIR"

# ------------------------------------------------------------------- 4. 环境
log "4/6 生成环境变量 .env"
if [ ! -f .env ]; then
  rand() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c "$1"; }
  cat > .env <<EOF
MYSQL_ROOT_PASSWORD=$(rand 20)
MYSQL_DATABASE=classpets
TOKEN_SECRET=$(rand 48)
ADMIN_DEFAULT_PASSWORD=$(rand 14)
APP_PORT=${APP_PORT}
EOF
  chmod 600 .env
  echo "已生成 .env（权限 600）"
else
  echo ".env 已存在，保留原配置（如需重置请删除该文件后重跑本脚本）"
fi

# ------------------------------------------------------------------- 5. 端口
log "5/6 放行防火墙端口 ${APP_PORT}"
if command -v ufw >/dev/null 2>&1; then
  ufw allow "${APP_PORT}/tcp" >/dev/null 2>&1 && echo "ufw 已放行" || true
fi
if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port="${APP_PORT}/tcp" >/dev/null 2>&1 || true
  firewall-cmd --reload >/dev/null 2>&1 || true
  echo "firewalld 已放行"
fi
echo "提示：腾讯云/阿里云还需在控制台「安全组」放行 ${APP_PORT} 端口"

# --------------------------------------------------------------- 6. 构建启动
log "6/6 构建并启动容器（首次构建约 5~15 分钟，请耐心等待）"
$DC up -d --build

log "等待服务健康检查"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 5
done

PUBLIC_IP="$(curl -fsS --max-time 5 ifconfig.me 2>/dev/null || echo '<服务器公网IP>')"
ADMIN_PASS="$(grep '^ADMIN_DEFAULT_PASSWORD=' .env | cut -d= -f2-)"
MYSQL_PASS="$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)"

echo
echo "==================== 部署结果 ===================="
if [ "$ready" -eq 1 ]; then
  echo "状态：服务已就绪"
  curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" || true
  echo
else
  echo "状态：健康检查超时，请执行以下命令排查："
  echo "  cd $APP_DIR && $DC ps && $DC logs --tail=100 app"
fi
echo "--------------------------------------------------"
echo "访问地址：http://${PUBLIC_IP}:${APP_PORT}"
echo "后台管理：http://${PUBLIC_IP}:${APP_PORT}/manage"
echo "管理员账号：admin"
echo "管理员密码：${ADMIN_PASS}"
echo "MySQL root 密码：${MYSQL_PASS}"
echo "数据目录：$APP_DIR"
echo "--------------------------------------------------"
echo "常用命令（需先 cd $APP_DIR）："
echo "  查看状态： $DC ps"
echo "  查看日志： $DC logs -f app"
echo "  停止服务： $DC down"
echo "  重启服务： $DC restart"
echo "  更新代码： git pull && $DC up -d --build"
echo "  备份数据： $DC exec mysql mysqldump -uroot -p\"${MYSQL_PASS}\" classpets > backup.sql"
echo "=================================================="
echo "请立即保存上面的管理员密码与 MySQL 密码（.env 权限为 600，仅 root 可读）"
