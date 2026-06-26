# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 宏观指标 + 自选管理 + 群聊 + 预警 + VIP

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 七页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 7品种横滚卡片 + 成交额 + 温度计 + 涨跌家数 + 板块资金 TOP10 |
| 📈 **自选** | TradingView K线图（可缩放/拖拽/十字光标）+ 自选列表 + 添加/删除 + 分时K线 |
| 📊 **指标** | M1M2/贷款/准备金四宫格 + 上证月线叠加 + 24h缓存秒开 |
| 📰 **新闻** | AI精选RSS股票/商品 + 新浪宏观 + 星级排序 + 自动刷新 |
| 💬 **聊天** | Supabase实时群聊 + 语音消息 + Lucide表情面板(48个) + 24h历史 |
| 🔔 **预警** | 条件触发 + 推送/震动/语音通知 + 5分钟防骚扰 |
| 👑 **VIP** | 申请审核 + 会员登录 + 管理员发布策略 + 密码管理 |

---

## 🛠 技术栈

React 19 + Vite + Tailwind CSS 4 + Supabase + TradingView Lightweight-Charts v5 + Cloudflare Pages

---

## 📁 项目结构

```
src/
├── pages/           HomePage / Dashboard / IndicatorsPage / NewsPage / ChatPage / AlertsPage / VipPage
│   └── vip/         VipHome / VipLogin / VipMember / VipAdmin
├── components/      TopBar / MarketBar / Watchlist / StockChart / ErrorBoundary / Toast / Skeleton
├── hooks/           useMarketData / useAlertChecker / useNetworkStatus
├── context/         AppContext (全局路由 + 行情 + Toast)
├── lib/             constants / supabase
functions/api/       data / kline / breadth / flow / rss-news / macro-news / macro-data / sh-monthly / search / admin
public/              PWA manifest + service-worker + _headers
```

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| 行情（A股+商品） | 新浪 hq.sinajs.cn | 3s |
| K线（股票/商品） | 新浪 + iTick（分时） | 按需 |
| 宏观指标 | 东方财富 datacenter | 1h + 24h缓存 |
| 上证月线 | 新浪日K聚合 | 24h |
| 新闻 | RSS + 新浪财经 | 5min |
| 涨跌家数 | 财联社 | 30s |
| 板块资金 | 东方财富 emdatah5 | 30s |
| 聊天/VIP | Supabase | 实时 |

---

## 🚀 部署

```bash
npm install
npm run dev          # 本地开发 (server.cjs :3456 + Vite :5173)
npm run build        # 生产构建
npx wrangler pages deploy dist --project-name=fenghuotai --branch=main --commit-dirty=true
```

**Cloudflare 环境变量**：在 Pages 控制台设置 `ADMIN_USER`、`ADMIN_PASS`、`ADMIN_SECRET`
