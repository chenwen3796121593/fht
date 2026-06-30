# 🔥 烽火台 TradeBoard

跨市场实时行情看板 — A股指数 + 大宗商品 + 贵金属 + 宏观指标 + 自选 + 群聊 + 预警 + AI分析 + 预测大模型 + VIP

**线上地址**：https://fenghuotai.pages.dev

---

## 📋 页面功能

| 页面 | 功能 |
|------|------|
| 🏠 **首页** | 7品种横滚卡片 + 成交额(环比昨日) + 温度计 + 涨跌家数(10s刷新) + 板块资金流入/流出TOP10 |
| 📈 **自选** | TradingView K线图 + 成交量 + 自选列表 + 分时/日线/全部 |
| 📊 **指标** | M1/M2/贷款/准备金 SVG四宫格 + 上证月线叠加 + 24h缓存 |
| 📰 **新闻** | RSS股票/商品 + 新浪宏观 + 星级排序 + 5min自动刷新 |
| 💬 **聊天** | Supabase实时群聊 + 语音消息 + 48个Lucide表情 + 消息缓存 + @提及 |
| ⚡ **分析** | 预测大模型(4模型×5表格) + AI深度分析(DeepSeek+Serenity框架) + 预警(价格触发+推送/震动/语音) |
| 💰 **贵金属** | 沪金/沪银/铂金/钯金 实时销售价 + AI商品预测(Supabase实时) + 微信二维码 |
| 👑 **VIP** | 申请审核 + 会员登录 + 管理员JWT校验 + 策略发布 + 预测大模型AI服务 |

---

## 🛠 技术栈

React 19 + Vite 8 + Tailwind CSS 4 + Supabase + TradingView Lightweight-Charts v5 + Cloudflare Pages + Workers DO (视频信令) + Service Worker (数据代理) + DeepSeek API (AI分析)

---

## 📁 项目结构

```
src/
├── pages/           HomePage / Dashboard / IndicatorsPage / NewsPage / ChatPage / AlertsPage / MetalsPage / VipPage
│   └── vip/         VipHome / VipLogin / VipMember / VipAdmin
├── components/      TopBar / MarketBar / Watchlist / StockChart / ErrorBoundary / Skeleton / VideoRoom / IncomingCall
├── hooks/           useMarketData / useAlertChecker
├── context/         AppContext(路由+行情+Toast+涨跌预加载)
├── lib/             constants(公共常量+normalizeSymbol) / supabase
functions/api/       data / kline / breadth / flow / rss-news / macro-news / macro-data / sh-monthly / search / metals / admin / ai-analyze / predict-data / yesterday-turnover / video-ws
public/              PWA manifest + service-worker + _headers + qrcode
```

---

## 📡 数据源

| 数据 | 来源 | 频率 |
|------|------|:--:|
| A股+商品行情 | 新浪 hq.sinajs.cn | 3s |
| 股票K线(日/分时) | 新浪 CN_MarketData | 按需 |
| 商品K线(日线) | 新浪 GlobalFutures(限300根) | 按需 |
| 贵金属实时价 | 新浪 nf_AU0/AG0/PT0/PD0 | 30s |
| 板块资金流向 | push2.eastmoney.com (SW代理) | 30s |
| 昨日成交额 | push2his.eastmoney.com (SW代理) | 收盘后 |
| 预测大模型 | GitHub Raw (CF Function代理) | 按需刷新 |
| AI分析 | DeepSeek API (CF Function代理) | 按需 |
| 宏观指标 | 东方财富 datacenter + 24h缓存 | 1h |
| 新闻 | RSS + 新浪财经 | 5min |
| 涨跌家数 | 财联社 + localStorage缓存(5min) | 10s |
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

**Cloudflare 环境变量**：
`ADMIN_USER` / `ADMIN_PASS` / `ADMIN_SECRET` / `DEEPSEEK_API_KEY` / `AI_ANALYSIS_PASS` / `GH_DATA_URL` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
