# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 自选管理 + 群聊 + PWA

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 五页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 8 品种横滚 + 成交额 + 温度计 + 涨跌家数 + 板块资金 |
| 📈 **自选** | K 线（日线/全部）+ 自选列表 + 添加/删除 |
| 📰 **新闻** | AI精选 RSS + Ai 宏观筛选 |
| 💬 **聊天** | 实时群聊 + 语音消息 + 历史记录 |
| 🔔 **预警** | 条件触发 + PWA 推送 |

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| 行情 | 新浪 `hq.sinajs.cn` | 10s |
| K 线（股票） | 新浪 CN_MarketData | 按需 |
| K 线（商品） | 新浪 GlobalFutures | 按需+Actions 日更 |
| K 线（期货） | 新浪 InnerFutures | 按需 |
| 新闻（股票） | RSS `chenheping1974.github.io` | 每日 |
| 新闻（商品） | RSS `chenheping1974.github.io` | 每日 |
| 新闻（宏观） | 新浪财经 + 权威关键词筛选 | 5min |
| 涨跌家数 | 财联社 `x-quote.cls.cn` | 30s |
| 板块资金 | 东方财富 `emdatah5` | 30s |
| 聊天 | Supabase Realtime | 实时 |

---

## 🛠 技术栈

React 19 + Vite + Tailwind CSS + Supabase + Cloudflare Pages + GitHub Actions

---

## 🚀 本地开发

```bash
npm install
npm run dev
```

## 📦 部署

```bash
npm run build
npx wrangler pages deploy dist --project-name=fenghuotai
```

## 🔑 服务

| 服务 | 用途 |
|------|------|
| Cloudflare Pages | 前端托管 + Functions 代理 |
| Cloudflare KV | K线缓存 |
| GitHub Actions | 每日 15:30 更新商品K线 |
| Supabase | 聊天消息 + 文件存储 |
