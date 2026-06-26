# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — 沪深指数 + 大宗商品 + 贵金属 + 宏观指标 + 自选 + 群聊 + 预警 + VIP

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 八页面

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 7品种横滚卡片 + 成交额 + 温度计 + 涨跌家数(10s刷新+缓存秒显) + 板块资金TOP10 |
| 📈 **自选** | TradingView K线图(缩放/拖拽/十字光标) + 自选列表 + 分时/日线/全部 |
| 📊 **指标** | M1/M2/贷款/准备金四宫格 + 上证月线叠加 + 24h缓存 |
| 📰 **新闻** | RSS股票/商品 + 新浪宏观 + 星级排序 + 自动刷新 |
| 💬 **聊天** | Supabase实时群聊 + 语音消息 + 48个Lucide表情 + 消息缓存秒开 + 日期显示 |
| 🔔 **预警** | 条件触发 + 推送/震动/语音 + 5分钟防骚扰 |
| 💎 **贵金属** | 沪金/沪银/铂金/钯金 实时销售价(元/克) + 新浪期货数据(HTTPS) |
| 👑 **VIP** | 申请审核 + 会员登录 + 管理员后台校验 + 策略发布 + 密码管理 |

---

## 🛠 技术栈

React 19 + Vite 8 + Tailwind CSS 4 + Supabase + TradingView Lightweight-Charts v5 + Cloudflare Pages

---

## 📁 项目结构

```
src/
├── pages/           HomePage / Dashboard / IndicatorsPage / NewsPage / ChatPage / AlertsPage / MetalsPage / VipPage
│   └── vip/         VipHome / VipLogin / VipMember / VipAdmin
├── components/      TopBar(电子时钟) / MarketBar / Watchlist / StockChart(TradingView) / ErrorBoundary / Skeleton
├── hooks/           useMarketData(统一行情) / useAlertChecker
├── context/         AppContext(路由+行情+Toast)
├── lib/             constants(公共常量+品种列表+normalizeSymbol) / supabase
functions/api/       data / kline / breadth / flow / rss-news / macro-news / macro-data / sh-monthly / search / metals / admin
public/              PWA manifest + service-worker + _headers(缓存策略) + qrcode
```

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| A股+商品行情 | 新浪 hq.sinajs.cn | 3s |
| 股票K线 | 新浪 CN_MarketData | 按需 |
| 商品K线 | 新浪 GlobalFutures(限300根) | 按需 |
| 贵金属 | 新浪 nf_AU0/AG0/PT0/PD0 | 30s |
| 宏观指标 | 东方财富 datacenter + 24h缓存 | 1h |
| 新闻 | RSS + 新浪财经 | 5min |
| 涨跌家数 | 财联社 + localStorage缓存 | 10s |
| 板块资金 | 东方财富 emdatah5 | 按需 |
| 聊天/VIP | Supabase | 实时 |

---

## 🚀 部署

```bash
npm install
npm run dev          # 本地开发 (server.cjs :3456 + Vite :5173)
npm run build        # 生产构建
npx wrangler pages deploy dist --project-name=fenghuotai --branch=main --commit-dirty=true
```

**Cloudflare 环境变量**：`ADMIN_USER` / `ADMIN_PASS` / `ADMIN_SECRET` / `ITICK_KEY`
