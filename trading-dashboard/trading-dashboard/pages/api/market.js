import {
  calcRSI, calcEMA, calcMACD, calcBollingerBands,
  calcStochRSI, calcVolumeRatio, findSupportResistance,
  detectPatterns, generateSignal
} from '../../lib/indicators'

const COIN_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana',
  BNB: 'binancecoin', ARB: 'arbitrum', MATIC: 'matic-network',
  AVAX: 'avalanche-2', LINK: 'chainlink', TAO: 'bittensor',
  ONDO: 'ondo-finance'
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

export default async function handler(req, res) {
  const { coin = 'BTC', days = 30 } = req.query
  const coinId = COIN_IDS[coin.toUpperCase()] || 'bitcoin'

  try {
    const baseUrl = 'https://api.coingecko.com/api/v3'
    const apiKey = process.env.COINGECKO_API_KEY
    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : ''

    // Fetch OHLC + market data in parallel
    const [ohlcData, marketData, fearGreed] = await Promise.all([
      fetchWithRetry(`${baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}${keyParam}`),
      fetchWithRetry(`${baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false${keyParam}`),
      fetchWithRetry('https://api.alternative.me/fng/?limit=1')
    ])

    // Parse OHLC
    const opens = ohlcData.map(d => d[1])
    const highs = ohlcData.map(d => d[2])
    const lows = ohlcData.map(d => d[3])
    const closes = ohlcData.map(d => d[4])
    const timestamps = ohlcData.map(d => d[0])

    // Fetch volume separately (OHLC doesn't include volume)
    const volumeData = await fetchWithRetry(
      `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily${keyParam}`
    )
    const volumes = volumeData.volumes?.map(v => v[1]) || closes.map(() => 1e9)

    // Calculate indicators
    const rsi = calcRSI(closes)
    const macd = calcMACD(closes)
    const bb = calcBollingerBands(closes)
    const stochRsi = calcStochRSI(closes)
    const ema20 = calcEMA(closes, 20)
    const ema50 = calcEMA(closes, Math.min(50, closes.length - 1))
    const volumeRatio = calcVolumeRatio(volumes)

    const currentPrice = marketData.market_data.current_price.usd
    const priceChange24h = marketData.market_data.price_change_percentage_24h
    const priceChange7d = marketData.market_data.price_change_percentage_7d
    const marketCap = marketData.market_data.market_cap.usd
    const volume24h = marketData.market_data.total_volume.usd
    const marketCapRank = marketData.market_cap_rank

    const sr = findSupportResistance(highs, lows, closes, currentPrice)
    const patterns = detectPatterns(closes, volumes, rsi, macd, bb)

    const indicators = { rsi, macd, bb, stochRsi, volumeRatio, ema20, ema50 }
    const signal = generateSignal(indicators, currentPrice, sr)

    const fg = fearGreed.data?.[0] || {}

    // Candle data for chart (last 60 candles)
    const candles = ohlcData.slice(-60).map((d, i) => ({
      time: Math.floor(d[0] / 1000),
      open: d[1], high: d[2], low: d[3], close: d[4],
      volume: volumes[ohlcData.length - 60 + i] || 0
    }))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.status(200).json({
      coin: coin.toUpperCase(),
      price: currentPrice,
      priceChange24h,
      priceChange7d,
      marketCap,
      volume24h,
      marketCapRank,
      indicators: {
        rsi,
        macd: macd ? { value: macd.macd, signal: macd.signal, histogram: macd.histogram } : null,
        bb,
        stochRsi,
        ema20,
        ema50,
        volumeRatio
      },
      sr,
      patterns,
      signal,
      fearGreed: {
        value: parseInt(fg.value || 50),
        label: fg.value_classification || 'Neutral'
      },
      candles,
      updatedAt: Date.now()
    })
  } catch (err) {
    console.error('Market data error:', err)
    res.status(500).json({ error: err.message })
  }
}
