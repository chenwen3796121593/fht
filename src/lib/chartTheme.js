// 图表配色唯一真源
// 设计系统的颜色令牌定义在 index.css 的 :root。lightweight-charts 不认 CSS var()，
// 故在运行时从 :root 读取已解析的值，保证图表与界面配色始终一致（只改这一处即可全局换色）。

function cssVar(name, fallback) {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return v ? v.trim() : fallback
}

export function getChartTheme() {
  return {
    // 图表底 = 背景抬升层（原硬编码 #0E1117）
    bg: cssVar('--bg-elev', '#0E1117'),
    // 网格线（原 #1A212B）
    grid: cssVar('--border-soft', '#1A212A'),
    // 坐标轴描边（原 #232B36）
    border: cssVar('--border', '#232B36'),
    // 坐标轴文字（原 #5C6573）
    text: cssVar('--text-3', '#5C6573'),
    // 涨 / 跌（中国习惯：涨红 跌绿）
    up: cssVar('--up', '#F2554F'),
    down: cssVar('--down', '#25C285'),
    // 金 / 亮金 / 弱化灰
    gold: cssVar('--gold', '#E8B04B'),
    goldBright: cssVar('--gold-bright', '#F8D083'),
    muted: cssVar('--text-2', '#98A1AD'),
    // 量能柱半透明（涨 / 跌）
    upFill: 'rgba(242,85,79,0.4)',
    downFill: 'rgba(37,194,133,0.4)',
    // 对比基准线（如上证次日均线）
    compare: 'rgba(180,180,180,0.45)',
  }
}
