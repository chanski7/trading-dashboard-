# 📈 Trading Dashboard — Deploy Guide

Dashboard analisis crypto gratis dengan sinyal entry/exit, indikator teknikal real-time, dan AI analyst.

## Stack
- **Frontend + Backend:** Next.js 14 (gratis di Vercel)
- **Data harga:** CoinGecko API (gratis)
- **Sentimen:** Alternative.me Fear & Greed (gratis)
- **AI Analyst:** Claude Sonnet via Anthropic API

---

## 🚀 Deploy ke Vercel (GRATIS) — Step by Step

### Step 1: Buat akun GitHub (jika belum)
1. Buka https://github.com/signup
2. Daftar gratis

### Step 2: Upload project ke GitHub
1. Buka https://github.com/new
2. Nama repo: `trading-dashboard`
3. Pilih **Private**, klik **Create repository**
4. Di halaman repo baru, klik **"uploading an existing file"**
5. Upload semua file dari folder ini (drag & drop)
6. Klik **Commit changes**

### Step 3: Daftar Vercel
1. Buka https://vercel.com/signup
2. Pilih **Continue with GitHub**
3. Authorize Vercel

### Step 4: Import project
1. Di Vercel dashboard, klik **"Add New Project"**
2. Pilih repo `trading-dashboard`
3. Klik **Import**

### Step 5: Set Environment Variables
Di bagian **Environment Variables**, tambahkan:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxxxxx` (dari console.anthropic.com) |
| `COINGECKO_API_KEY` | (opsional, biarkan kosong untuk free tier) |

### Step 6: Deploy
1. Klik **Deploy**
2. Tunggu ~2 menit
3. Vercel akan memberikan URL gratis: `https://trading-dashboard-xxxx.vercel.app`

---

## 🔑 Cara dapat API Key Gratis

### Anthropic (Claude AI)
1. Buka https://console.anthropic.com
2. Sign up gratis
3. Klik **API Keys** → **Create Key**
4. Copy key yang dihasilkan
5. **Catatan:** Anthropic memberikan credit gratis untuk new account

### CoinGecko (Opsional)
1. Buka https://www.coingecko.com/en/api
2. Klik **Get Free API Key**
3. Daftar gratis
4. Copy Demo API Key
5. Tanpa key pun tetap bisa, hanya rate limit lebih ketat (30 req/menit)

---

## 📊 Fitur Dashboard

- **Tab Teknikal:** RSI, MACD, Stochastic RSI, EMA 20/50, Bollinger Bands, Support/Resistance
- **Tab Sinyal:** Skor komposit 0-100, Entry zone, TP1, TP2, Stop Loss, Risk:Reward ratio
- **Tab On-Chain:** Proxy metrics gratis + link ke tools on-chain terbaik
- **Tab Narasi:** 6 narasi crypto trending dengan buzz score
- **Tab AI Analyst:** Tanya Claude untuk analisis mendalam

## 🔄 Auto-refresh
Data diperbarui otomatis setiap 60 detik. CoinGecko free tier: 30 request/menit.

## 💡 Tips
- Gunakan di desktop untuk tampilan terbaik
- AI Analyst butuh ANTHROPIC_API_KEY — tanpa key, tab AI tidak akan berfungsi
- Untuk data whale real-time, gunakan Glassnode Studio (gratis terbatas) atau Coinglass
