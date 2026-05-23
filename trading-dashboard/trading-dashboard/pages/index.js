import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

const COINS = ['BTC','ETH','SOL','BNB','ARB','MATIC','AVAX','LINK','TAO','ONDO']

const NARRATIVES = [
  { name:'AI Agents', score:92, color:'#22c55e', tokens:'TAO, NEAR, FET, VIRTUAL', desc:'AI + crypto infra booming', badge:'🔥 HOT' },
  { name:'RWA Tokenisasi', score:78, color:'#3b82f6', tokens:'ONDO, MKR, PENDLE', desc:'BlackRock & institusi masuk', badge:'TRENDING' },
  { name:'DePIN', score:65, color:'#8b5cf6', tokens:'HNT, RNDR, FIL, IO', desc:'Infrastruktur fisik terdesentralisasi', badge:'GROWING' },
  { name:'BTC L2', score:55, color:'#f59e0b', tokens:'STX, ORDI, SATS', desc:'Bitcoin layer-2 ecosystem', badge:'EARLY' },
  { name:'Liquid Staking', score:70, color:'#22c55e', tokens:'LDO, EIGEN, rETH', desc:'Yield dari staking', badge:'AKTIF' },
  { name:'GameFi', score:48, color:'#f59e0b', tokens:'IMX, RON, PIXEL', desc:'Game blockchain gen baru', badge:'RECOVERY' },
]

function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return '—'
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1000) return '$' + n.toLocaleString('en', { maximumFractionDigits: decimals })
  return '$' + n.toFixed(decimals)
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—'
  const sign = n >= 0 ? '▲ +' : '▼ '
  return <span className={n >= 0 ? 'up' : 'down'}>{sign}{Math.abs(n).toFixed(2)}%</span>
}

function ScoreRing({ score }) {
  const color = score >= 68 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const r = 30, circ = 2 * Math.PI * r
  const fill = circ - (circ * score / 100)
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="40" y="36" textAnchor="middle" fill={color} fontSize="16" fontWeight="600">{score}</text>
      <text x="40" y="50" textAnchor="middle" fill="#555e73" fontSize="10">/100</text>
    </svg>
  )
}

function IndicatorRow({ label, sub, value, badge, badgeType, progress, progressColor }) {
  return (
    <div className="row">
      <div>
        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div className="row-sub">{sub}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        {badge ? <span className={`badge badge-${badgeType || 'gray'}`}>{badge}</span>
          : <span style={{ fontWeight: 600 }}>{value}</span>}
        {progress !== undefined && (
          <div className="progress" style={{ width: 100, marginLeft: 'auto' }}>
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progressColor || '#3b82f6' }} />
          </div>
        )}
      </div>
    </div>
  )
}

function AIChat({ marketData, coin }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: `Halo! Saya AI Analyst Anda. Tanyakan apa saja tentang market ${coin} atau strategi trading.` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const QUICK = [
    `Analisis teknikal ${coin} dan rekomendasinya`,
    'Narasi crypto paling kuat sekarang?',
    'Cara baca RSI dan MACD untuk entry',
    'Strategi manajemen risiko crypto',
    `Level entry terbaik ${coin} saat ini`
  ]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(q) {
    const question = q || input.trim()
    if (!question || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context: marketData })
      })
      const data = await res.json()
      setMsgs(m => [...m, { role: 'ai', text: data.answer || data.error || 'Error.' }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Koneksi gagal. Coba lagi.' }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            style={{ padding: '5px 10px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 20, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
            {q} ↗
          </button>
        ))}
      </div>
      <div style={{ minHeight: 200, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: '10px 13px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
            background: m.role === 'user' ? 'rgba(59,130,246,0.12)' : 'var(--bg3)',
            color: m.role === 'user' ? '#93c5fd' : 'var(--text)',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: m.role === 'user' ? '80%' : '100%',
            whiteSpace: 'pre-wrap'
          }}>{m.text}</div>
        ))}
        {loading && (
          <div style={{ padding: '10px 13px', borderRadius: 8, background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13 }}>
            <span className="spinner" style={{ marginRight: 8 }} />Menganalisis...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Tanya tentang ${coin}, strategi, indikator...`}
          style={{ flex: 1, padding: '9px 13px', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, color: 'var(--text)', outline: 'none' }} />
        <button onClick={() => send()} disabled={loading}
          style={{ padding: '9px 18px', background: '#3b82f6', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
          Kirim ↗
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [coin, setCoin] = useState('BTC')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('technical')
  const [lastUpdate, setLastUpdate] = useState(null)
  const refreshRef = useRef(null)

  const fetchData = useCallback(async (c) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/market?coin=${c}&days=30`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setData(d)
      setLastUpdate(new Date())
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData(coin)
    if (refreshRef.current) clearInterval(refreshRef.current)
    refreshRef.current = setInterval(() => fetchData(coin), 60000)
    return () => clearInterval(refreshRef.current)
  }, [coin, fetchData])

  function getRSIColor(v) {
    if (!v) return '#888'
    if (v < 30) return '#22c55e'
    if (v < 50) return '#86efac'
    if (v > 75) return '#ef4444'
    if (v > 60) return '#f59e0b'
    return '#3b82f6'
  }

  function getPatternBadge(type) {
    if (type === 'bullish') return 'green'
    if (type === 'bearish') return 'red'
    if (type === 'warning') return 'amber'
    return 'gray'
  }

  const d = data
  const ind = d?.indicators || {}
  const sig = d?.signal || {}
  const sr = d?.sr || {}
  const fg = d?.fearGreed || {}

  return (
    <>
      <Head>
        <title>Trading Dashboard — {coin}/USDT</title>
        <meta name="description" content="Dashboard analisis crypto dengan sinyal entry/exit, indikator teknikal, dan AI analyst" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 16px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>📈 Trading Analyst</span>
            {!loading && <span className="live-indicator"><span className="live-dot" />LIVE</span>}
            {loading && <span className="spinner" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastUpdate && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Update: {lastUpdate.toLocaleTimeString('id-ID')}</span>}
            <select value={coin} onChange={e => setCoin(e.target.value)}
              style={{ padding: '7px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>
              {COINS.map(c => <option key={c} value={c}>{c}/USDT</option>)}
            </select>
            <button onClick={() => fetchData(coin)}
              style={{ padding: '7px 12px', background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 8, color: 'var(--text2)' }}>
              ↻
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', marginBottom: 16, fontSize: 13 }}>
            ⚠️ Error memuat data: {error}. CoinGecko free tier mungkin rate-limited — coba lagi dalam 60 detik.
          </div>
        )}

        {/* Metric cards */}
        <div className="grid-4" style={{ marginBottom: 14 }}>
          <div className="metric-card">
            <div className="metric-label">Harga</div>
            <div className="metric-value">{d ? fmt(d.price) : '—'}</div>
            <div className="metric-sub">{d ? fmtPct(d.priceChange24h) : null} <span style={{ color: 'var(--text3)', fontSize: 11 }}>24h</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Volume 24h</div>
            <div className="metric-value">{d ? fmt(d.volume24h) : '—'}</div>
            <div className="metric-sub" style={{ color: 'var(--text3)' }}>Vol ratio: {ind.volumeRatio ? <span style={{ color: ind.volumeRatio > 1.2 ? 'var(--green)' : 'var(--text2)' }}>{ind.volumeRatio}x avg</span> : '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Market Cap</div>
            <div className="metric-value">{d ? fmt(d.marketCap) : '—'}</div>
            <div className="metric-sub" style={{ color: 'var(--text3)' }}>Rank #{d?.marketCapRank || '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Fear & Greed</div>
            <div className="metric-value" style={{ color: fg.value >= 60 ? 'var(--amber)' : fg.value <= 30 ? 'var(--green)' : 'var(--text)' }}>
              {fg.value ?? '—'}
            </div>
            <div className="metric-sub" style={{ color: 'var(--text2)' }}>{fg.label || '—'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[['technical','📊 Teknikal'],['signal','⚡ Sinyal'],['whale','🐋 On-Chain'],['narrative','🔥 Narasi'],['ai','🤖 AI Analyst']].map(([id, label]) => (
            <button key={id} className={`tab${activeTab===id?' active':''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {/* TECHNICAL TAB */}
        {activeTab === 'technical' && (
          <div>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="card">
                <div className="section-label">Indikator Momentum</div>
                <IndicatorRow label="RSI (14)" sub={ind.rsi < 30 ? 'Oversold — potensi bounce' : ind.rsi > 70 ? 'Overbought — hati-hati' : 'Zona netral'}
                  value={ind.rsi?.toFixed(1) ?? '—'}
                  progress={ind.rsi} progressColor={getRSIColor(ind.rsi)} />
                <IndicatorRow label="MACD" sub={ind.macd?.histogram > 0 ? 'Histogram positif — bullish momentum' : 'Histogram negatif — bearish momentum'}
                  badge={ind.macd ? (ind.macd.histogram > 0 ? 'BULLISH' : 'BEARISH') : '—'}
                  badgeType={ind.macd?.histogram > 0 ? 'green' : 'red'} />
                <IndicatorRow label="Stoch RSI K" sub={ind.stochRsi?.k < 20 ? 'Sangat oversold' : ind.stochRsi?.k > 80 ? 'Sangat overbought' : 'Normal'}
                  value={ind.stochRsi?.k?.toFixed(1) ?? '—'} />
                <IndicatorRow label="EMA 20 / 50"
                  sub={ind.ema20 && ind.ema50 ? (ind.ema20 > ind.ema50 ? 'Golden cross — tren naik' : 'Death cross — tren turun') : '—'}
                  badge={ind.ema20 && ind.ema50 ? (ind.ema20 > ind.ema50 ? 'GOLDEN CROSS' : 'DEATH CROSS') : '—'}
                  badgeType={ind.ema20 > ind.ema50 ? 'green' : 'red'} />
                <IndicatorRow label="Bollinger Band"
                  sub={d && ind.bb ? (d.price > ind.bb.upper ? 'Di atas upper — potensi koreksi' : d.price < ind.bb.lower ? 'Di bawah lower — oversold' : 'Di dalam band') : '—'}
                  badge={ind.bb?.bandwidth < 3 ? 'SQUEEZE' : d?.price > ind.bb?.upper ? 'UPPER' : d?.price < ind.bb?.lower ? 'LOWER' : 'NORMAL'}
                  badgeType={ind.bb?.bandwidth < 3 ? 'amber' : d?.price > ind.bb?.upper ? 'amber' : 'gray'} />
              </div>
              <div className="card">
                <div className="section-label">Support & Resistance</div>
                {[
                  { label: 'Resistance 2', val: sr.r2, color: '#ef4444' },
                  { label: 'Resistance 1', val: sr.r1, color: '#f87171' },
                  { label: 'Harga Saat Ini', val: d?.price, color: 'var(--text)', bold: true },
                  { label: 'Support 1', val: sr.s1, color: '#4ade80' },
                  { label: 'Support 2', val: sr.s2, color: '#22c55e' },
                ].map(({ label, val, color, bold }) => (
                  <div key={label} className="row">
                    <span style={{ color: color, fontWeight: bold ? 600 : 400 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: color }}>{val ? fmt(val) : '—'}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <div className="section-label">Pola Terdeteksi</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {d?.patterns?.length ? d.patterns.map((p, i) => (
                      <span key={i} className={`badge badge-${getPatternBadge(p.type)}`}>{p.name}</span>
                    )) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Memuat...</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* BB values */}
            {ind.bb && (
              <div className="card">
                <div className="section-label">Bollinger Bands Detail</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[['Upper', ind.bb.upper], ['Middle (SMA20)', ind.bb.middle], ['Lower', ind.bb.lower], ['Bandwidth', ind.bb.bandwidth + '%']].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontWeight: 600 }}>{typeof v === 'number' ? fmt(v) : v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SIGNAL TAB */}
        {activeTab === 'signal' && (
          <div>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="card">
                <div className="section-label">Skor Komposit & Rekomendasi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0 16px' }}>
                  <ScoreRing score={sig.score ?? 50} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: sig.actionColor || 'var(--text)', marginBottom: 4 }}>
                      {sig.action || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 200 }}>
                      {sig.score >= 68 ? 'Setup menarik. Konfirmasi dengan volume & price action.' : sig.score >= 50 ? 'Mixed signals. Tunggu konfirmasi lebih jelas.' : 'Sinyal lemah. Lebih baik tunggu setup yang lebih baik.'}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
                  <div className="section-label">Breakdown Skor</div>
                  {[
                    ['Teknikal (RSI+MACD+BB)', Math.min(100, Math.max(0, Math.round(((ind.rsi ? (ind.rsi < 50 ? 70 : ind.rsi < 65 ? 60 : 40) : 50) + (ind.macd?.histogram > 0 ? 75 : 35) + (d?.price > ind.bb?.lower ? 60 : 80)) / 3)))],
                    ['Trend (EMA20/50)', ind.ema20 && ind.ema50 ? (ind.ema20 > ind.ema50 ? 78 : 38) : 50],
                    ['Momentum (Stoch RSI)', ind.stochRsi?.k < 30 ? 82 : ind.stochRsi?.k > 70 ? 35 : 60],
                    ['Volume', ind.volumeRatio > 1.3 ? 75 : ind.volumeRatio < 0.8 ? 40 : 58],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text2)' }}>
                      <span>{label}</span>
                      <span style={{ color: val >= 65 ? 'var(--green)' : val >= 50 ? 'var(--amber)' : 'var(--red)', fontWeight: 600 }}>{val}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="section-label">Entry / Exit Plan</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🟢 Entry Zone
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Entry Agresif</div>
                      <div style={{ fontWeight: 700, color: '#4ade80', fontSize: 15 }}>{sig.entry2 ? fmt(sig.entry2) : '—'}</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(34,197,94,0.05)', border: '0.5px solid rgba(34,197,94,0.15)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Entry Konservatif</div>
                      <div style={{ fontWeight: 700, color: '#86efac', fontSize: 15 }}>{sig.entry1 ? fmt(sig.entry1) : '—'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🎯 Take Profit
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(59,130,246,0.2)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>TP1 (R:R {sig.rr1}x)</div>
                      <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 15 }}>{sig.tp1 ? fmt(sig.tp1) : '—'}</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(59,130,246,0.05)', border: '0.5px solid rgba(59,130,246,0.15)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>TP2 (R:R {sig.rr2}x)</div>
                      <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: 15 }}>{sig.tp2 ? fmt(sig.tp2) : '—'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>🛑 Stop Loss</div>
                      <div style={{ fontWeight: 700, color: '#f87171', fontSize: 15 }}>{sig.sl ? fmt(sig.sl) : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Risk/Reward</div>
                      <div style={{ fontWeight: 700, color: sig.rr1 >= 2 ? '#4ade80' : sig.rr1 >= 1.5 ? '#fbbf24' : '#f87171', fontSize: 18 }}>
                        1 : {sig.rr1 || '—'}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                  ⚠️ Sinyal ini dihitung dari data teknikal CoinGecko. Bukan financial advice. Selalu atur position sizing sesuai toleransi risiko Anda. Maksimal 1-2% modal per trade.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WHALE / ON-CHAIN TAB */}
        {activeTab === 'whale' && (
          <div className="grid-2">
            <div className="card">
              <div className="section-label">On-Chain Proxy Metrics</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, padding: '8px 10px', background: 'rgba(59,130,246,0.06)', borderRadius: 6 }}>
                ℹ️ Data on-chain real-time (Glassnode) memerlukan API berbayar. Berikut adalah estimasi dari data CoinGecko & Alternative.me yang tersedia gratis.
              </div>
              <IndicatorRow label="Fear & Greed Index" sub="Sentimen pasar keseluruhan"
                badge={`${fg.value ?? '—'} — ${fg.label || '—'}`}
                badgeType={fg.value >= 60 ? 'amber' : fg.value <= 30 ? 'green' : 'gray'} />
              <IndicatorRow label="Volume vs Rata-rata" sub={ind.volumeRatio > 1.3 ? 'Volume tinggi → konfirmasi lebih kuat' : 'Volume normal atau rendah'}
                badge={ind.volumeRatio ? `${ind.volumeRatio}x rata-rata` : '—'}
                badgeType={ind.volumeRatio > 1.5 ? 'green' : ind.volumeRatio > 1 ? 'blue' : 'gray'} />
              <IndicatorRow label="Price Momentum 7d" sub="Tren mingguan"
                badge={d?.priceChange7d ? `${d.priceChange7d.toFixed(2)}%` : '—'}
                badgeType={d?.priceChange7d > 5 ? 'green' : d?.priceChange7d < -5 ? 'red' : 'gray'} />
              <IndicatorRow label="RSI sebagai proxy MVRV" sub={ind.rsi > 70 ? 'Mungkin overbought / distribusi' : ind.rsi < 35 ? 'Mungkin oversold / akumulasi' : 'Valuasi normal'}
                badge={ind.rsi > 70 ? 'DISTRIBUSI' : ind.rsi < 35 ? 'AKUMULASI' : 'NETRAL'}
                badgeType={ind.rsi > 70 ? 'amber' : ind.rsi < 35 ? 'green' : 'gray'} />
              <IndicatorRow label="EMA Spread" sub="Jarak EMA20 vs EMA50 = momentum"
                badge={ind.ema20 && ind.ema50 ? `${((ind.ema20 - ind.ema50) / ind.ema50 * 100).toFixed(2)}%` : '—'}
                badgeType={ind.ema20 > ind.ema50 ? 'green' : 'red'} />
            </div>
            <div className="card">
              <div className="section-label">Sumber Data Gratis Lainnya</div>
              {[
                { name: 'CoinGecko', url: 'https://www.coingecko.com', desc: 'Harga, volume, market cap live', free: true },
                { name: 'Alternative.me', url: 'https://alternative.me/crypto/fear-and-greed-index/', desc: 'Fear & Greed Index harian', free: true },
                { name: 'CryptoQuant (free)', url: 'https://cryptoquant.com', desc: 'Exchange reserve, miner flow (terbatas)', free: true },
                { name: 'Glassnode Studio (free)', url: 'https://studio.glassnode.com', desc: 'On-chain metrics dasar gratis', free: true },
                { name: 'Santiment (free)', url: 'https://app.santiment.net', desc: 'Social sentiment & dev activity', free: true },
                { name: 'Coinglass', url: 'https://www.coinglass.com', desc: 'Open interest, funding rate, liquidasi', free: true },
              ].map(({ name, url, desc, free }) => (
                <div key={name} className="row">
                  <div>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    <div className="row-sub">{desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {free && <span className="badge badge-green">GRATIS</span>}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>Buka ↗</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NARRATIVE TAB */}
        {activeTab === 'narrative' && (
          <div>
            <div className="grid-3" style={{ marginBottom: 12 }}>
              {NARRATIVES.map(n => (
                <div key={n.name} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{n.name}</span>
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>{n.badge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{n.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Token terkait: <span style={{ color: n.color }}>{n.tokens}</span></div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${n.score}%`, background: n.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Buzz: {n.score}/100</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="section-label">Cara Membaca Narasi Market</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                <p style={{ marginBottom: 8 }}>Narasi mendorong siklus alt season. Token yang sesuai narasi kuat biasanya outperform BTC saat market bull. Strategi: masuk lebih awal ketika buzz score mulai naik dari 40 ke atas, exit ketika semua media mainstream membahasnya (FOMO peak).</p>
                <p>Sumber narasi terbaik (gratis): Twitter/X Crypto Twitter, CoinTelegraph, The Block, Bankless Podcast, dan Messari Research.</p>
              </div>
            </div>
          </div>
        )}

        {/* AI ANALYST TAB */}
        {activeTab === 'ai' && (
          <div className="card">
            <div className="section-label">AI Analyst — Powered by Claude</div>
            <AIChat marketData={d} coin={coin} />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, border: '0.5px solid var(--border)' }}>
          ⚠️ <strong style={{ color: 'var(--text2)' }}>Disclaimer:</strong> Dashboard ini hanya untuk tujuan edukasi dan riset. Sinyal yang dihasilkan berdasarkan analisis teknikal otomatis dan bukan merupakan financial advice. Crypto adalah aset berisiko tinggi. Selalu lakukan riset sendiri (DYOR) dan investasikan hanya yang mampu Anda rugikan.
        </div>
      </div>
    </>
  )
}
