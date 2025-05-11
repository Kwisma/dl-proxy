# GitHub 文件加速服务（CDN Proxy）

这是一个基于 Node.js、Express 和 Redis 构建的简易 CDN 服务，用于加速访问 GitHub 仓库中的原始文件内容。

## ✨ 功能简介

- 提供通过简洁 URL 访问 GitHub 仓库文件的接口
- 支持 `/gh/user/repo@branch/path/to/file` 和 `/gh/user/repo/refs/heads/branch/path/to/file` 两种格式
- 使用 Redis 缓存请求结果，减少 GitHub 请求次数，加快访问速度
- 支持通过参数强制刷新缓存（`?qure`）
- 默认主页提供简单使用说明

## 项目说明

1. **模块化设计**：将功能拆分为独立的模块，便于维护和测试。
2. **清晰的目录结构**：
   - `src/` - 主代码目录
   - `config/` - 配置文件
   - `controllers/` - 路由控制器
   - `services/` - 业务逻辑服务
   - `routes/` - 路由定义
   - `utils/` - 工具函数
   - `public/` - 静态文件
   - `logs/` - 日志文件

3. **启动项目**：
   - 安装依赖：`npm install`
   - 生产模式：`npm start`

4. **Redis 集成**：自动检查并启动 Redis 服务。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd <project-directory>
````

### 2. 安装依赖

```bash
npm install
```

### 3. 启动 Redis 服务

确保本地 Redis 服务已启动，监听在默认端口 `6379`。

### 4. 启动项目

```bash
npm run start
```

服务默认运行在 `http://localhost:3000`

## 📌 使用方式

### 示例请求格式：

```
/gh/用户名/仓库名@分支名/文件路径
```

或：

```
/gh/用户名/仓库名/refs/heads/分支名/文件路径
```

### 示例：

```
/gh/user/repo@main/path
```

## 🔄 缓存说明

* 静态资源（如 `.css`、`.js`、`.jpg`、`.png`）：缓存 1 小时
* 其他文件：缓存 10 分钟
* 添加 `?qure` 参数可强制刷新缓存，如：

```
/gh/user/repo@main/path?qure
```

## ⚙️ 环境变量

* `PORT`：服务运行端口（默认 `3000`）

## 🧩 技术栈

* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [Redis](https://redis.io/)
* [Axios](https://axios-http.com/)
* [CORS](https://github.com/expressjs/cors)

## 📄 许可证

MIT License