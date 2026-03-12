# AI Data Analyst

智能数据分析助手 - 支持自然语言交互的数据分析平台

## 功能特点

- 📁 **多文件上传** - 支持同时上传多个 Excel 文件
- 🤖 **AI 智能分析** - 自动识别数据结构，生成分析框架
- 💬 **自然语言对话** - 用中文描述需求，AI 理解并执行
- 📊 **可视化展示** - 自动生成图表和分析报告
- 🔄 **模型切换** - 支持 DeepSeek 和 Kimi 两种 AI 模型

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- XLSX (Excel 解析)

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加 API Keys

# 启动开发服务器
npm run dev
```

## 环境变量

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
KIMI_API_KEY=your_kimi_api_key
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

## License

MIT
