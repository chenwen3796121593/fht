# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — A股指数 + 大宗商品 + 自选管理 + 群聊 + PWA

**线上地址**：https://fenghuotai.pages.dev

## 功能

| 模块 | 功能 |
|------|------|
| 📊 实时行情 | 上证/深证/黄金/白银/原油/铜，新浪 API |
| ⭐ 自选管理 | 添加股票/商品，localStorage 持久化 |
| 📈 K 线图 | 纯 SVG 蜡烛图 + 成交量，时间切换 |
| 📰 智能新闻 | 只显示自选相关，IndexedDB 离线缓存 |
| 💬 实时群聊 | Supabase 数据库，消息持久化 |
| 🔔 预警系统 | 涨跌幅/突破条件，PWA 推送+震动+语音 |
| 📱 PWA | 浏览器一键安装，离线可用 |

## 技术栈

React 19 + Vite + Tailwind CSS + Supabase + Cloudflare Pages

- 图表：纯 SVG（零依赖）
- 数据：新浪财经 → Pages Functions 代理
- 聊天：Supabase Realtime + PostgreSQL
- 图标：lucide-react

## 本地开发

```bash
npm install
npm run dev
```

## 部署

```bash
npm run build
npx wrangler pages deploy dist --project-name=fenghuotai
```

## 项目结构

```
src/
├── pages/          # 四页面
├── components/     # TopBar/MarketCards/Watchlist/StockChart
├── hooks/          # useMarketData/useNews
├── functions/api/  # Pages Functions 代理
├── server.cjs      # 本地代理
└── public/         # PWA manifest + service worker
```
