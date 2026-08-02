// src/app/api/analysis/route.ts
import { NextResponse } from 'next/server';

type ReqBody = { prompt?: string; model?: string; useSearch?: boolean };

const HF_DEFAULT = process.env.HF_MODEL || 'google/flan-t5-small';
const GEMINI_DEFAULT = process.env.GEMINI_MODEL || 'models/assistant-lite';
const ALLOW_WASM = (process.env.ALLOW_WASM_FALLBACK || 'true') === 'true';

function parseWhitelist(): Record<string,string> | null {
  try {
    const raw = process.env.MODEL_WHITELIST_JSON;
    if (!raw) return null;
    return JSON.parse(raw) as Record<string,string>;
  } catch {
    return null;
  }
}

function isAllowedModel(model: string) {
  const wl = parseWhitelist();
  if (!wl) return true;
  return !!wl[model];
}

function isModelAfterCutoff(model: string) {
  const cutoff = process.env.MIN_MODEL_DATE; // e.g. "2024-01-01"
  if (!cutoff) return true;
  const wl = parseWhitelist();
  if (!wl || !wl[model]) return false;
  try {
    return new Date(wl[model]) >= new Date(cutoff);
  } catch {
    return false;
  }
}

const rateMap = new Map<string, { count:number, reset:number }>();
function checkRate(ip: string, limit = parseInt(process.env.RATE_LIMIT_PER_MIN || '60', 10)) {
  const now = Date.now();
  const windowMs = 60_000;
  const s = rateMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > s.reset) { s.count = 0; s.reset = now + windowMs; }
  s.count++;
  rateMap.set(ip, s);
  return s.count <= limit;
}

async function callSerpApi(q: string) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&num=5&hl=en&gl=us&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const snippets = (data.organic_results || []).slice(0,5).map((r:any) => r.snippet || r.title || r.link).filter(Boolean);
  return snippets.join('\n\n');
}

async function callHuggingFace(model: string, prompt: string) {
  const key = process.env.HF_API_KEY;
  if (!key) throw new Error('HF_API_KEY not set');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256, do_sample: false } }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HF error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const text = Array.isArray(json) ? (json[0]?.generated_text ?? '') : (json.generated_text ?? JSON.stringify(json));
  return { provider: 'huggingface', model, text, raw: json };
}

async function callGemini(model: string, prompt: string) {
  const saJson = process.env.GEMINI_SA_JSON;
  if (!saJson) throw new Error('GEMINI_SA_JSON not set');

  const { GoogleAuth } = await import('google-auth-library');
  const sa = JSON.parse(saJson);
  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  const token = typeof tokenRes === 'string' ? tokenRes : ((tokenRes as any)?.token || '');
  const endpoint = `https://generativelanguage.googleapis.com/v1/${model}:generate`;
  const body = {
    prompt: { text: prompt },
    maxOutputTokens: 512,
    temperature: 0.2,
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const text = (json?.candidates && json.candidates[0]?.content) || json?.output?.text || JSON.stringify(json);
  return { provider: 'gemini', model, text, raw: json };
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: ReqBody;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const prompt = (body?.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'no prompt' }, { status: 400 });

  const requestedModel = (body?.model || '').trim();
  const geminiModel = requestedModel || process.env.GEMINI_MODEL || GEMINI_DEFAULT;
  const hfModel = requestedModel || process.env.HF_MODEL || HF_DEFAULT;

  let augmentedPrompt = prompt;
  if (body?.useSearch && process.env.SERPAPI_KEY) {
    try {
      const searchText = await callSerpApi(prompt);
      if (searchText) augmentedPrompt = `Web context:\n${searchText}\n\nUser prompt:\n${prompt}`;
    } catch { /* ignore SERP errors */ }
  }

  const chosenModel = process.env.GEMINI_SA_JSON ? geminiModel : hfModel;
  if (!isAllowedModel(chosenModel)) {
    return NextResponse.json({ error: 'model_not_allowed', model: chosenModel }, { status: 403 });
  }
  if (!isModelAfterCutoff(chosenModel)) {
    return NextResponse.json({ error: 'model_too_old', model: chosenModel }, { status: 403 });
  }

  try {
    if (process.env.GEMINI_SA_JSON) {
      const out = await callGemini(geminiModel, augmentedPrompt);
      return NextResponse.json(out);
    } else if (process.env.HF_API_KEY) {
      const out = await callHuggingFace(hfModel, augmentedPrompt);
      return NextResponse.json(out);
    } else if (ALLOW_WASM) {
      return NextResponse.json({ provider: 'wasm_fallback', model: null, text: 'WASM fallback: run a local/browser model', raw: null });
    } else {
      return NextResponse.json({ error: 'no_provider_configured' }, { status: 503 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'provider_error', details: String(err?.message || err) }, { status: 502 });
  }
}
