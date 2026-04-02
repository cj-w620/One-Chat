# One Chat - AI 对话助手

基于 Next.js 14 和硅基流动 API 的 AI 对话应用。

## 技术栈

- **前端框架**: Next.js 14 (App Router) + React 18 + TypeScript
- **样式方案**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **AI 服务**: 硅基流动 API

## 项目结构

```
One-Chat/
├── app/                    # Next.js App Router
│   ├── api/chat/          # 对话 API 路由
│   ├── layout.tsx         # 全局布局
│   └── page.tsx           # 首页
├── client/               # 前端 API 客户端（数据层）
│   └── api-client.ts    # API 请求封装
├── components/            # React 组件（表现层）
│   ├── chat/             # 对话相关组件
│   └── ui/               # shadcn/ui 组件
├── hooks/                # 自定义 Hooks（逻辑层）
├── lib/                  # 工具函数
│   └── utils.ts         # 通用工具函数
├── server/               # 后端服务
│   ├── clients/         # 外部服务客户端
│   └── services/        # 业务逻辑服务
└── types/               # TypeScript 类型定义
```

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填入你的硅基流动 API Key：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```
SILICONFLOW_API_KEY=your_actual_api_key_here
```

获取 API Key：https://cloud.siliconflow.cn

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 功能特性

- ✅ 基础 AI 对话功能
- ✅ 用户消息在右侧，AI 回复在左侧
- ✅ 加载状态提示
- ✅ 错误处理
- ✅ API Key 安全（服务端代理）

## License

MIT
