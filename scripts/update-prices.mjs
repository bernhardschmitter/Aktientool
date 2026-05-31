import fs from 'node:fs/promises';
import vm from 'node:vm';

const DATA_FILE = new URL('../data.js', import.meta.url);
const OUT_FILE = new URL('../prices.json', import.meta.url);
const VERSION = 'V3.17';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function yyyymmdd(d) {
  return d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}
function symbolCandidates(sym) {
  const raw = String(sym || '').trim().toLowerCase();
  if (!raw) return [];
  const out = [raw];
  if (!raw.includes('.')) out.push(raw + '.us');
  // Stooq nutzt fuer deutsche/Xetra-Werte nicht immer die Yahoo-Endung .DE.
  // Deshalb testen wir zusaetzlich das Kuerzel ohne Endung.
  if (raw.endsWith('.de')) out.push(raw.replace(/\.de$/, ''));
  return [...new Set(out)];
}
function stooqUrl(symbol) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 35);
  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${yyyymmdd(start)}&d2=${yyyymmdd(end)}&i=d`;
}
function yahooUrl(symbol) {
  // Yahoo Chart API liefert fuer viele deutsche Werte direkt Symbole wie ADS.DE, BMW.DE usw.
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
}
function parseCsv(text) {
  const clean = String(text || '').trim();
  if (!clean || /no data/i.test(clean)) throw new Error('Keine Kursdaten');
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Keine Kurszeilen');
  const rows = lines.slice(1).map(line => line.split(',')).filter(c => c.length >= 5 && c[0] && c[4] !== 'N/D');
  if (!rows.length) throw new Error('Keine gueltigen Kurszeilen');
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : null;
  const close = Number(last[4]);
  if (!Number.isFinite(close)) throw new Error('Ungueltiger Schlusskurs');
  return {
    date: last[0],
    open: Number(last[1]),
    high: Number(last[2]),
    low: Number(last[3]),
    close,
    volume: Number(last[5] || 0),
    prevClose: prev ? Number(prev[4]) : null,
    source: 'Stooq EOD'
  };
}
function parseYahooJson(text, symbol) {
  const data = JSON.parse(text);
  const result = data?.chart?.result?.[0];
  const error = data?.chart?.error;
  if (error) throw new Error(error.description || error.code || 'Yahoo Fehler');
  if (!result) throw new Error('Keine Yahoo-Daten');

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const volumes = quote.volume || [];

  const valid = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = Number(closes[i]);
    if (Number.isFinite(close)) valid.push(i);
  }
  if (!valid.length) throw new Error('Keine gueltigen Yahoo-Kurse');

  const lastIdx = valid[valid.length - 1];
  const prevIdx = valid.length > 1 ? valid[valid.length - 2] : null;
  const date = new Date(timestamps[lastIdx] * 1000).toISOString().slice(0, 10);
  return {
    date,
    open: Number(opens[lastIdx]),
    high: Number(highs[lastIdx]),
    low: Number(lows[lastIdx]),
    close: Number(closes[lastIdx]),
    volume: Number(volumes[lastIdx] || 0),
    prevClose: prevIdx !== null ? Number(closes[prevIdx]) : null,
    source: 'Yahoo Finance EOD',
    symbolUsed: symbol
  };
}
async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Aktientool-GitHub-Action/3.17' } });
  } finally {
    clearTimeout(timer);
  }
}
async function fetchYahooQuote(stock) {
  const symbol = String(stock.symbol || '').trim().toUpperCase();
  if (!symbol) throw new Error('Leeres Symbol');
  const res = await fetchWithTimeout(yahooUrl(symbol));
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} bei ${symbol}`);
  return parseYahooJson(await res.text(), symbol);
}
async function fetchStooqQuote(stock) {
  const tried = [];
  for (const cand of symbolCandidates(stock.symbol)) {
    tried.push(cand);
    const res = await fetchWithTimeout(stooqUrl(cand));
    if (!res.ok) throw new Error(`Stooq HTTP ${res.status} bei ${cand}`);
    try {
      const q = parseCsv(await res.text());
      q.symbolUsed = cand;
      return q;
    } catch (e) {
      // Naechsten Kandidaten testen
    }
  }
  throw new Error('Keine Stooq-Daten fuer Kandidaten: ' + tried.join(', '));
}
async function fetchQuote(stock) {
  const errors = [];
  try {
    return await fetchYahooQuote(stock);
  } catch (e) {
    errors.push('Yahoo: ' + String(e.message || e));
  }
  try {
    return await fetchStooqQuote(stock);
  } catch (e) {
    errors.push('Stooq: ' + String(e.message || e));
  }
  throw new Error(errors.join(' | '));
}
async function readStocks() {
  const code = await fs.readFile(DATA_FILE, 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.AKTIEN_DATA?.stocks || [];
}
async function main() {
  const stocks = await readStocks();
  const quotes = {};
  const errors = {};
  let ok = 0;
  for (const stock of stocks) {
    const key = String(stock.symbol || '').toUpperCase();
    try {
      const q = await fetchQuote(stock);
      quotes[key] = { ...q, error: '', updatedAt: new Date().toISOString(), fallbackPrice: stock.price };
      ok++;
      console.log(`OK ${key} ${q.date} ${q.close} (${q.source}, ${q.symbolUsed})`);
    } catch (e) {
      errors[key] = String(e.message || e);
      console.log(`ERR ${key}: ${errors[key]}`);
    }
    await sleep(120);
  }
  const out = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    source: 'Automatisches EOD-Update via GitHub Action / Yahoo Finance mit Stooq-Fallback',
    symbolsTotal: stocks.length,
    count: Object.keys(quotes).length,
    errorCount: Object.keys(errors).length,
    errors,
    quotes
  };
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`Done: ${ok} OK, ${Object.keys(errors).length} Fehler`);
}
main().catch(err => { console.error(err); process.exit(1); });
