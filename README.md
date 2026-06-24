# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 自选管理 + 群聊 + PWA

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 8 品种横滚卡片 + 两市成交额 + 市场温度 + 实时涨跌家数/涨停跌停 + 板块资金流向 |
| 📈 **自选** | K 线图（蜡烛+成交量+MA 均线）+ 自选列表 + 添加股票 |
| 📰 **新闻** | 财联社/新浪财经实时新闻，按自选过滤，IndexedDB 离线缓存 |
| 💬 **聊天** | Supabase 实时群聊 + 语音消息 + 消息持久化 24h |
| 🔔 **预警** | 自设涨跌幅/价格条件，PWA 推送 + 震动 |

---

## 🔧 技术栈

**前端**：React 19 + Vite + Tailwind CSS + lucide-react  
**图表**：纯 SVG（零依赖，无 canvas 库）  
**后端**：Cloudflare Pages Functions + GitHub Actions  
**数据**：新浪财经 / 腾讯 / 财联社 / 东方财富  
**聊天**：Supabase Realtime + PostgreSQL + Storage  
**部署**：Cloudflare Pages + KV

---

## 📡 数据源

| 数据 | 接口 | 更新频率 |
|------|------|:--:|
| A 股行情 | `hq.sinajs.cn`（新浪） | 10s |
| 商品行情 | `hq.sinajs.cn`（新浪） | 10s |
| 指数 K 线 | `money.finance.sina.com.cn`（CN_MarketData） | 按需 + Actions 日更 |
| 商品 K 线 | `stock2.finance.sina.com.cn`（GlobalFutures） | 按需 + Actions 日更 |
| 国内期货 K 线 | `stock2.finance.sina.com.cn`（InnerFutures） | 按需 |
| 新闻 | `feed.mix.sina.com.cn`（4 频道） | 60s |
| 涨跌家数 | `x-quote.cls.cn`（财联社） | 30s |
| 板块资金 | `emdatah5.eastmoney.com`（东方财富） | 30s |
| 聊天 | Supabase Realtime | 实时推送 |

---

## 🗄️ Cloudflare KV 缓存

```
Key                     │ Value
────────────────────────┼──────────────
kline:sh000001          │ 上证 500 根日K
kline:XAU               │ 黄金 5000+ 根日K
breadth:latest          │ 最新涨跌家数缓存
```

- **GitHub Actions** 每天 15:30 自动拉取 8 个商品 K 线 → 存 KV
- **Pages Functions** 按需拉取股票 K 线 → 自动合并到 KV
- **Worker** 只读 KV，毫秒级返回

---

## 🚀 本地开发

```bash
npm install
npm run dev          # 启动 Vite + 数据代理
```

浏览器打开 `http://localhost:5173`

---

## 📦 部署

```bash
npm run build
npx wrangler pages deploy dist --project-name=fenghuotai
```

---

## 📁 项目结构

```
tradeboard/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx         # 首页（行情+涨跌+资金）
│   │   ├── Dashboard.jsx        # 自选（K 线+列表）
│   │   ├── NewsPage.jsx         # 新闻（筛选+缓存）
│   │   ├── ChatPage.jsx         # 群聊（文字+语音）
│   │   └── AlertsPage.jsx       # 预警（条件+推送）
│   ├── components/
│   │   ├── TopBar.jsx           # 顶部导航
│   │   ├── MarketBar.jsx        # 横滚行情卡片
│   │   ├── Watchlist.jsx        # 自选列表
│   │   └── StockChart.jsx       # SVG K 线图
│   └── hooks/
│       ├── useMarketData.js     # 新浪行情
│       └── useNews.js           # 新闻+缓存+筛选
├── functions/api/
│   ├── data.js                  # 行情代理
│   ├── kline.js                 # K 线代理（KV 缓存）
│   ├── news.js                  # 新闻代理
│   ├── breadth.js               # 涨跌家数代理
│   └── flow.js                  # 板块资金代理
├── scripts/
│   └── update-kline.mjs         # GitHub Actions 日更脚本
├── .github/workflows/
│   └── update-kline.yml         # 定时 15:30 CST
├── server.cjs                   # 本地开发代理
├── wrangler.toml                # CF 配置（KV 绑定）
└── public/
    ├── manifest.json            # PWA 配置
    └── service-worker.js        # 离线+推送
```

---

## 🔑 环境变量 & Secrets

| 位置 | 变量 | 说明 |
|------|------|------|
| GitHub Actions | `CF_ACCOUNT_ID` | Cloudflare 账号 ID |
| GitHub Actions | `CF_KV_TOKEN` | Cloudflare API Token |
| `~/.claude.json` | `figma-mcp-go` | Figma 本地插件 |
| `~/.claude.json` | `make` | Make.com MCP |
| `~/.claude.json` | `agent-vision` | 通义千问看图 |
| 本地 `server.cjs` | - | 无需凭证（国内直连） |
