# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 自选管理 + 群聊 + PWA

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 五页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 8 品种横滚卡片 + 成交额 + 温度计 + 涨跌家数 + 板块资金 |
| 📈 **自选** | 实时 K 线（OHLC 真实数据）+ 自选列表 + 添加/删除 + AI 搜索 |
| 📰 **新闻** | AI 精选 RSS 股票+商品 + 新浪财经宏观（权威筛选）+ 星级排序 |
| 💬 **聊天** | Supabase 实时群聊 + 语音消息 + 24h 历史 |
| 🔔 **预警** | 条件触发 + PWA 推送通知 + 语音播报 + 实时检测 |

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| 行情（A股+商品） | 新浪 `hq.sinajs.cn`（含 OHLC） | 10s |
| K 线（股票/指数） | 新浪 CN_MarketData | 按需+KV 缓存 |
| K 线（国际商品） | 新浪 GlobalFutures | 按需+Actions 日更 |
| K 线（国内期货） | 新浪 InnerFutures | 按需 |
| 新闻（股票） | RSS a-stocks.xml（AI 精选） | 每日 |
| 新闻（商品） | RSS commodities.xml（AI 精选） | 每日 |
| 新闻（宏观） | 新浪财经 lid=2509 | 5min |
| 涨跌家数 | 财联社 x-quote.cls.cn | 30s |
| 板块资金 | 东方财富 emdatah5 | 30s |
| 聊天 | Supabase Realtime + PostgreSQL | 实时 |

---

## 🛠 技术栈

React 19 + Vite + Tailwind CSS + Supabase + Cloudflare Pages + GitHub Actions

---

## 🚀 部署

```bash
npm install
npm run dev          # 本地开发
npm run build        # 生产构建
npx wrangler pages deploy dist --project-name=fenghuotai
```

## 📁 项目结构

```
src/
├── pages/           # HomePage/Dashboard/NewsPage/ChatPage/AlertsPage
├── components/      # TopBar/MarketBar/Watchlist/StockChart
├── hooks/           # useMarketData/useAlertChecker
functions/api/       # CF Functions（data/kline/breadth/flow/rss-news/macro-news/search）
scripts/             # GitHub Actions 自动更新 K 线
server.cjs           # 本地开发代理
public/              # PWA manifest + service worker
```
