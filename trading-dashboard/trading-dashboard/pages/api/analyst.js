export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context } = req.body
  if (!question) return res.status(400).json({ error: 'No question' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  const systemPrompt = `Kamu adalah AI Trading Analyst profesional untuk crypto. Jawab dalam Bahasa Indonesia yang jelas, padat, dan actionable.

Data market saat ini:
${context ? JSON.stringify(context, null, 2) : 'Data tidak tersedia'}

Panduan menjawab:
- Fokus pada insight yang bisa langsung digunakan trader
- Sebutkan level harga spesifik jika relevan
- Bedakan antara setup berisiko tinggi dan rendah
- Selalu sertakan disclaimer singkat di akhir: "⚠️ Bukan financial advice. DYOR."
- Maksimal 250 kata
- Gunakan angka dan data dari context jika tersedia`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }]
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.content?.map(b => b.text || '').join('') || ''
    res.status(200).json({ answer: text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
