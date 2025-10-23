# 🎵 音乐歌词 Web 应用

一个简洁优雅的音乐歌词搜索和播放应用，支持网易云音乐和QQ音乐双平台。

## ✨ 功能特性

- 🔍 **多平台搜索** - 支持网易云音乐和QQ音乐
- 🎵 **歌词播放** - 实时滚动显示歌词
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 💾 **本地收藏** - 创建和管理个人歌曲合集
- 🔗 **分享功能** - 生成二维码分享歌单
- ⚡ **离线缓存** - 一键缓存歌词，支持离线查看
- 🌐 **PWA 支持** - 可安装为原生应用

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/music-lyrics-web.git
cd music-lyrics-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端API服务器
npm run server

# 或者同时启动前后端
npm run dev:full
```

### Docker 部署

#### 使用预构建镜像（包含前端 + API）

```bash
# 从 GitHub Container Registry 拉取
docker pull ghcr.io/your-username/music-lyrics-web:latest

# 从 Docker Hub 拉取
docker pull your-dockerhub-username/music-lyrics-web:latest

# 运行容器（同时提供前端和API服务）
docker run -d -p 80:80 -p 3001:3001 --name music-lyrics-web ghcr.io/your-username/music-lyrics-web:latest
```

#### 本地构建

```bash
# 构建镜像
docker build -t music-lyrics-web .

# 运行容器
docker run -d -p 80:80 -p 3001:3001 --name music-lyrics-web music-lyrics-web
```

#### Docker Compose

```yaml
version: '3.8'
services:
  web:
    image: ghcr.io/your-username/music-lyrics-web:latest
    ports:
      - "80:80"      # 前端服务
      - "3001:3001"  # API 服务
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🔧 技术栈

- **前端**: Vue 3 + Vite
- **路由**: Vue Router 4
- **API**: Express.js + music-api-sdk
- **容器化**: Docker + Nginx
- **CI/CD**: GitHub Actions

## 📦 自动化部署

项目配置了 GitHub Actions 自动化工作流：

### GitHub Container Registry

推送到 `main` 分支或创建标签时自动构建并推送到 GitHub Container Registry：

```bash
# 镜像地址
ghcr.io/your-username/music-lyrics-web:latest
ghcr.io/your-username/music-lyrics-web:v1.0.0
```

### Docker Hub

需要配置以下 GitHub Secrets：

- `DOCKERHUB_USERNAME` - Docker Hub 用户名
- `DOCKERHUB_TOKEN` - Docker Hub 访问令牌

```bash
# 镜像地址
your-dockerhub-username/music-lyrics-web:latest
your-dockerhub-username/music-lyrics-web:v1.0.0
```

## 🔐 环境配置

### GitHub Secrets 配置

为了启用 Docker Hub 自动推送，需要在 GitHub 仓库设置中添加以下 Secrets：

1. 进入仓库 Settings → Secrets and variables → Actions
2. 添加以下 secrets：
   - `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名
   - `DOCKERHUB_TOKEN`: Docker Hub 访问令牌

### Docker Hub 令牌创建

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 进入 Account Settings → Security
3. 点击 "New Access Token"
4. 输入令牌名称，选择权限
5. 复制生成的令牌到 GitHub Secrets

## 🌐 部署架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│  Container Reg  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Docker Image   │
                       │                  │
                       │  ┌─────────────┐ │
                       │  │    Nginx    │ │
                       │  └─────────────┘ │
                       │  ┌─────────────┐ │
                       │  │  Vue.js App │ │
                       │  └─────────────┘ │
                       └──────────────────┘
```

## 📱 PWA 功能

应用支持 Progressive Web App 功能：

- 📱 可安装到主屏幕
- 🔄 离线缓存支持
- 📊 应用清单配置
- 🎨 自定义图标和主题

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [music-api-sdk](https://github.com/jsososo/music-api-sdk) - 音乐API服务
- [Vue.js](https://vuejs.org/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具