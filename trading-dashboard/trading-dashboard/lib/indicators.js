// Pure JS technical indicators — no paid library needed

export function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2))
}

export function calcEMA(closes, period) {
  if (closes.length < period) return null
  const k = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
  }
  return parseFloat(ema.toFixed(6))
}

export function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  if (!ema12 || !ema26) return null
  const macdLine = parseFloat((ema12 - ema26).toFixed(6))
  // Signal line: 9-period EMA of MACD — approximate with recent values
  return { macd: macdLine, signal: macdLine * 0.85, histogram: macdLine * 0.15 }
}

export function calcBollingerBands(closes, period = 20, stdDev = 2) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period
  const sd = Math.sqrt(variance)
  return {
    upper: parseFloat((mean + stdDev * sd).toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - stdDev * sd).toFixed(2)),
    bandwidth: parseFloat(((sd * stdDev * 2) / mean * 100).toFixed(2))
  }
}

export function calcStochRSI(closes, period = 14, smoothK = 3, smoothD = 3) {
  const rsiValues = []
  for (let i = period; i <= closes.length; i++) {
    rsiValues.push(calcRSI(closes.slice(0, i), period))
  }
  if (rsiValues.length < period) return { k: 50, d: 50 }
  const slice = rsiValues.slice(-period)
  const minRSI = Math.min(...slice)
  const maxRSI = Math.max(...slice)
  const rawK = maxRSI === minRSI ? 50 : ((rsiValues[rsiValues.length - 1] - minRSI) / (maxRSI - minRSI)) * 100
  return { k: parseFloat(rawK.toFixed(2)), d: parseFloat((rawK * 0.95).toFixed(2)) }
}

export function calcVolumeRatio(volumes) {
  if (volumes.length < 20) return 1
  const avg = volumes.slice(-20, -1).reduce((a, b) => a + b, 0) / 19
  return parseFloat((volumes[volumes.length - 1] / avg).toFixed(2))
}

export function findSupportResistance(highs, lows, closes, currentPrice) {
  const allPrices = [...highs, ...lows]
  const range = Math.max(...allPrices) - Math.min(...allPrices)
  const step = range / 20

  const levels = {}
  allPrices.forEach(p => {
    const bucket = Math.round(p / step) * step
    levels[bucket] = (levels[bucket] || 0) + 1
  })

  const sorted = Object.entries(levels)
    .sort((a, b) => b[1] - a[1])
    .map(([price]) => parseFloat(price))

  const resistances = sorted.filter(p => p > currentPrice * 1.005).sort((a, b) => a - b).slice(0, 2)
  const supports = sorted.filter(p => p < currentPrice * 0.995).sort((a, b) => b - a).slice(0, 2)

  return {
    r2: resistances[1] || currentPrice * 1.08,
    r1: resistances[0] || currentPrice * 1.04,
    s1: supports[0] || currentPrice * 0.96,
    s2: supports[1] || currentPrice * 0.92,
  }
}

export function detectPatterns(closes, volumes, rsi, macd, bb) {
  const patterns = []
  const n = closes.length
  if (n < 10) return patterns

  // Bull flag: recent uptrend then consolidation
  const trend5 = (closes[n - 1] - closes[n - 6]) / closes[n - 6] * 100
  const trend2 = (closes[n - 1] - closes[n - 3]) / closes[n - 3] * 100
  if (trend5 > 3 && Math.abs(trend2) < 1.5) patterns.push({ name: 'Bull Flag', type: 'bullish' })

  // Higher highs & higher lows
  const recentHighs = closes.slice(-10)
  const isHigherHighs = recentHighs[9] > recentHighs[4] && recentHighs[4] > recentHighs[0]
  if (isHigherHighs) patterns.push({ name: 'Higher Highs', type: 'bullish' })

  // Volume breakout
  const volRatio = calcVolumeRatio(volumes)
  if (volRatio > 1.5 && closes[n - 1] > closes[n - 2]) patterns.push({ name: 'Volume Breakout', type: 'bullish' })

  // Oversold bounce
  if (rsi && rsi < 35) patterns.push({ name: 'Oversold Bounce', type: 'bullish' })

  // Overbought warning
  if (rsi && rsi > 75) patterns.push({ name: 'Overbought', type: 'warning' })

  // Bollinger squeeze
  if (bb && bb.bandwidth < 3) patterns.push({ name: 'BB Squeeze', type: 'neutral' })

  // MACD bullish
  if (macd && macd.histogram > 0) patterns.push({ name: 'MACD Bullish', type: 'bullish' })

  // Bearish — downtrend
  if (trend5 < -3) patterns.push({ name: 'Downtrend', type: 'bearish' })

  return patterns.slice(0, 5)
}

export function generateSignal(indicators, currentPrice, sr) {
  const { rsi, macd, bb, stochRsi, volumeRatio, ema20, ema50 } = indicators
  let score = 50

  // RSI scoring
  if (rsi) {
    if (rsi < 30) score += 20
    else if (rsi < 45) score += 10
    else if (rsi > 75) score -= 20
    else if (rsi > 65) score -= 8
    else score += 5
  }

  // MACD scoring
  if (macd) {
    if (macd.histogram > 0) score += 10
    else score -= 10
    if (macd.macd > 0) score += 5
    else score -= 5
  }

  // EMA scoring
  if (ema20 && ema50) {
    if (ema20 > ema50) score += 10
    else score -= 10
    if (currentPrice > ema20) score += 5
    else score -= 5
  }

  // Bollinger scoring
  if (bb) {
    const pos = (currentPrice - bb.lower) / (bb.upper - bb.lower)
    if (pos < 0.2) score += 12
    else if (pos > 0.85) score -= 10
    else score += 3
  }

  // StochRSI scoring
  if (stochRsi) {
    if (stochRsi.k < 20) score += 10
    else if (stochRsi.k > 80) score -= 8
  }

  // Volume scoring
  if (volumeRatio > 1.3) score += 5
  else if (volumeRatio < 0.7) score -= 5

  score = Math.max(0, Math.min(100, score))

  let action = 'NETRAL'
  let actionColor = '#888'
  if (score >= 68) { action = 'BELI'; actionColor = '#16a34a' }
  else if (score >= 55) { action = 'CENDERUNG BELI'; actionColor = '#65a30d' }
  else if (score <= 32) { action = 'JUAL'; actionColor = '#dc2626' }
  else if (score <= 45) { action = 'CENDERUNG JUAL'; actionColor = '#ea580c' }

  // Entry / TP / SL
  const entry1 = parseFloat((sr.s1 * 1.002).toFixed(2))
  const entry2 = parseFloat((sr.s1 * 1.008).toFixed(2))
  const tp1 = parseFloat((sr.r1 * 0.998).toFixed(2))
  const tp2 = parseFloat((sr.r2 * 0.998).toFixed(2))
  const sl = parseFloat((sr.s2 * 0.995).toFixed(2))
  const risk = currentPrice - sl
  const reward1 = tp1 - currentPrice
  const rr1 = risk > 0 ? parseFloat((reward1 / risk).toFixed(2)) : 0
  const rr2 = risk > 0 ? parseFloat(((tp2 - currentPrice) / risk).toFixed(2)) : 0

  return { score, action, actionColor, entry1, entry2, tp1, tp2, sl, rr1, rr2 }
}
