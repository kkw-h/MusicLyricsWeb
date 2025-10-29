# Docker 部署指南

本项目已配置完整的 Docker 支持，可以通过 Docker 容器快速部署和运行。

## 前置要求

### 1. 安装 Docker

**macOS:**
```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或者从官网下载 Docker Desktop
# https://www.docker.com/products/docker-desktop/
```

**Linux (Ubuntu/Debian):**
```bash
# 更新包索引
sudo apt-get update

# 安装必要的包
sudo apt-get install ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 2. 验证安装
```bash
docker --version
docker-compose --version
```

## 快速启动

### 方法一：使用 docker-compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

### 方法二：使用 Docker 命令

```bash
# 构建镜像
docker build -t music-lyrics-web .

# 运行容器
docker run -d \
  --name music-lyrics-web \
  -p 80:8080 \
  --restart unless-stopped \
  music-lyrics-web

# 查看容器状态
docker ps

# 查看日志
docker logs -f music-lyrics-web

# 停止容器
docker stop music-lyrics-web
docker rm music-lyrics-web
```

## 配置说明

### Dockerfile 特性

- **多阶段构建**：优化镜像大小，分离构建环境和运行环境
- **非 root 用户**：使用专用用户运行服务，提高安全性
- **Alpine Linux**：基于轻量级 Alpine Linux，减少攻击面
- **健康检查**：内置健康检查机制
- **安全配置**：只读文件系统、临时目录挂载等安全措施

### docker-compose.yml 特性

- **端口映射**：容器内 8080 端口映射到宿主机 80 端口
- **资源限制**：CPU 和内存使用限制
- **重启策略**：容器异常退出时自动重启
- **健康检查**：定期检查服务健康状态
- **网络隔离**：使用自定义网络提高安全性
- **安全配置**：禁用新权限、只读根文件系统等

## 环境变量

可以通过环境变量自定义配置：

```yaml
environment:
  - NODE_ENV=production          # 运行环境
  - TZ=Asia/Shanghai            # 时区设置
```

## 健康检查

容器内置健康检查端点：`http://localhost:8080/health`

检查配置：
- 检查间隔：30秒
- 超时时间：10秒
- 重试次数：3次
- 启动等待：40秒

## 资源限制

默认资源配置：
- CPU 限制：1.0 核心
- 内存限制：512MB
- CPU 预留：0.25 核心
- 内存预留：128MB

## 安全特性

1. **非 root 用户运行**：使用专用的 nginx-user 用户
2. **只读根文件系统**：防止恶意文件写入
3. **临时目录挂载**：必要的临时目录使用 tmpfs
4. **禁用新权限**：防止权限提升攻击
5. **网络隔离**：使用自定义网络

## 故障排除

### 查看容器日志
```bash
# 使用 docker-compose
docker-compose logs -f music-lyrics-web

# 使用 docker 命令
docker logs -f music-lyrics-web
```

### 进入容器调试
```bash
# 使用 docker-compose
docker-compose exec music-lyrics-web sh

# 使用 docker 命令
docker exec -it music-lyrics-web sh
```

### 检查健康状态
```bash
# 检查健康检查状态
docker inspect music-lyrics-web | grep -A 10 "Health"

# 手动测试健康检查端点
curl http://localhost/health
```

### 重新构建镜像
```bash
# 强制重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 生产环境建议

1. **使用具体版本标签**：避免使用 `latest` 标签
2. **配置日志轮转**：防止日志文件过大
3. **监控资源使用**：定期检查 CPU 和内存使用情况
4. **备份配置文件**：定期备份 Docker 配置
5. **更新基础镜像**：定期更新基础镜像以获取安全补丁

## 访问应用

容器启动后，可以通过以下地址访问应用：

- 主页：http://localhost
- 健康检查：http://localhost/health

## 停止和清理

```bash
# 停止并删除容器
docker-compose down

# 删除镜像（可选）
docker rmi music-lyrics-web

# 清理未使用的资源
docker system prune -f
```