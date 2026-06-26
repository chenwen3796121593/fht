// 轮询间隔（毫秒）
export const POLL_INTERVAL = 3000
export const BREADTH_INTERVAL = 10000
export const MACRO_INTERVAL = 3600000
export const NEWS_INTERVAL = 300000
export const ALERT_COOLDOWN = 300000
export const CACHE_TTL = 86400000

// Supabase
export const SUPABASE_URL = 'https://fxpxlobftrdlswyhrnhv.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_nRjPbFK5D4BRzyJyh_-ahw_mivVK7Zq'

// 管理员（仅用户名，密码存后端环境变量）
export const ADMIN_USERNAME = 'chen'

// 基础行情品种
export const DEFAULT_SYMBOLS = [
  { symbol: 'sh000001', name: '上证指数', type: 'index' },
  { symbol: 'sz399001', name: '深证成指', type: 'index' },
  { symbol: 'hf_XAU', name: '现货黄金', type: 'commodity' },
  { symbol: 'hf_XAG', name: '现货白银', type: 'commodity' },
  { symbol: 'hf_CL', name: '国际原油', type: 'commodity' },
  { symbol: 'hf_HG', name: 'COMEX铜', type: 'commodity' },
  { symbol: 'hf_AHD', name: 'LME铝', type: 'commodity' },
  { symbol: 'nf_M0', name: '豆粕', type: 'commodity' },
]

// MarketBar 展示的品种（不含豆粕）
export const MARKETBAR_SYMBOLS = DEFAULT_SYMBOLS.filter(s => s.symbol !== 'nf_M0')

// 默认自选品种
export const DEFAULT_WATCHLIST = [
  { symbol: 'hf_XAU', name: '现货黄金' },
  { symbol: 'hf_XAG', name: '现货白银' },
  { symbol: 'hf_CL', name: '国际原油' },
  { symbol: 'hf_HG', name: 'COMEX铜' },
  { symbol: 'hf_AHD', name: 'LME铝' },
]

// Symbol normalization: add exchange prefix
export function normalizeSymbol(sym) {
  if (!sym) return ''
  if (sym.startsWith('sh') || sym.startsWith('sz') || sym.startsWith('bj') || sym.startsWith('hf_') || sym.startsWith('nf_')) return sym
  if (sym.startsWith('6')) return 'sh' + sym
  if (sym.startsWith('0') || sym.startsWith('3')) return 'sz' + sym
  if (sym.startsWith('8') || sym.startsWith('4')) return 'bj' + sym
  return sym
}
