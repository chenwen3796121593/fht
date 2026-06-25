# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 宏观指标 + 自选管理 + 群聊 + 预警 + VIP

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 七页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 8品种横滚卡片 + 成交额 + 温度计 + 涨跌家数 + 板块资金 |
| 📈 **自选** | 实时K线（OHLC）+ 自选列表 + 添加/删除 + A股分时K线 |
| 📊 **指标** | M1M2/贷款/准备金四宫格 + 上证月线叠加 + 24h缓存秒开 |
| 📰 **新闻** | AI精选RSS股票/商品 + 新浪宏观 + 星级排序 |
| 💬 **聊天** | Supabase实时群聊 + 语音消息 + 24h历史 |
| 🔔 **预警** | 条件触发 + 推送/震动/语音通知 + 5分钟防骚扰 |
| 👑 **VIP** | 申请审核 + 管理员发布策略 + 会员专属功能 |

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| 行情（A股+商品） | 新浪 hq.sinajs.cn | 3s |
| K线（股票） | 新浪 CN_MarketData + KV缓存 | 按需 |
| K线（商品日线） | 新浪 GlobalFutures + Actions日更 | 按需 |
| A股分时K线 | 新浪 CN_MarketData scale=5 | 按需 |
| 宏观指标 | 东方财富 datacenter | 1h+24h缓存 |
| 上证月线 | 新浪日K聚合 | 24h |
| 新闻 | RSS + 新浪财经 | 5min-每日 |
| 涨跌家数 | 财联社 | 30s |
| 板块资金 | 东方财富 emdatah5 | 30s |
| 聊天/VIP | Supabase | 实时 |

---

## 🛠 技术栈

React 19 + Vite + Tailwind CSS + Supabase + Cloudflare Pages + GitHub Actions

---

## 🚀 部署

```bash
npm install
npm run dev          # 本地开发 (server.cjs :3456 + Vite)
npm run build        # 生产构建
npx wrangler pages deploy dist --project-name=fenghuotai --branch=main --commit-dirty=true
```

---

## 📁 项目结构

```
src/
├── pages/           HomePage / Dashboard / IndicatorsPage / NewsPage / ChatPage / AlertsPage / VipPage
├── components/      TopBar / MarketBar / Watchlist / StockChart
├── hooks/           useMarketData / useAlertChecker
functions/api/       data / kline / breadth / flow / rss-news / macro-news / macro-data / sh-monthly / search
scripts/             GitHub Actions 自动更新K线
public/              PWA manifest + service-worker + _headers
```

---

## 🗄 Supabase表

| 表 | 用途 |
|------|------|
| `messages` | 聊天消息 |
| `vip_applications` | VIP申请（phone/reason/status） |
| `vip_users` | VIP会员（username/password/phone） |
| `vip_strategies` | 每日策略 |
