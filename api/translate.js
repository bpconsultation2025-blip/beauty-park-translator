/**
 * /api/translate — Beauty Park 실시간 상담 번역 (Gemini)
 * ------------------------------------------------------------
 * 한국어 원문을 받아 영어 / 중국어(간체) / 일본어로 한 번에 번역합니다.
 * 미용·성형 클리닉 상담 맥락을 프롬프트에 담아, 의료 톤을 유지한
 * 자연스러운 환자용 번역을 돌려줍니다.
 *
 * 보안: Gemini API 키는 서버 환경변수(GEMINI_API_KEY)에서만 읽습니다.
 *       절대 클라이언트(브라우저)로 노출되지 않습니다.
 *
 * 환경변수:
 *   GEMINI_API_KEY  (필수)  Google AI Studio에서 발급 → https://aistudio.google.com/apikey
 *   GEMINI_MODEL    (선택)  기본값 'gemini-2.5-flash'
 */

export const config = { runtime: 'nodejs' };

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_CHARS = 1000;

/* ── 아주 가벼운 인메모리 LRU 캐시 (동일 문장 재요청 시 비용 절감) ── */
const CACHE_MAX = 500;
const cache = new Map(); // key -> { translations }
function cacheGet(key) {
  if (!cache.has(key)) return null;
  const val = cache.get(key);
  cache.delete(key);
  cache.set(key, val); // move to most-recent
  return val;
}
function cacheSet(key, val) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, val);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

const SYSTEM_PROMPT = [
  'You are a professional medical interpreter for "Beauty Park", a Korean aesthetic',
  'dermatology & plastic-surgery clinic (뷰티파크의원 범어점). Staff type Korean; you',
  'translate it for foreign patients (medical tourists).',
  '',
  'Rules:',
  '- Translate the Korean text into natural, warm, patient-facing language.',
  '- Keep a polite, reassuring clinical tone — the reader is a patient at a clinic.',
  '- Preserve medical accuracy: botox(보톡스), filler(필러), laser(레이저),',
  '  lifting(리프팅), anesthesia(마취), touch-up(리터치) etc. Use the correct term',
  '  each target language actually uses.',
  '- Keep numbers, prices, durations, and time periods exactly accurate.',
  '- Do NOT add, omit, explain, or editorialize. Translate only what is written.',
  '- If the input is already partly non-Korean, translate the whole meaning anyway.',
  '- Simplified Chinese for "zh". Natural Japanese (敬語 where appropriate) for "ja".',
].join('\n');

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    en: { type: 'string' },
    zh: { type: 'string' },
    ja: { type: 'string' },
  },
  required: ['en', 'zh', 'ja'],
  propertyOrdering: ['en', 'zh', 'ja'],
};

async function callGemini(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: `Translate this Korean:\n"""\n${text}\n"""` }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`gemini_http_${r.status}: ${detail.slice(0, 300)}`);
  }

  const j = await r.json();
  const out = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) {
    const reason = j?.candidates?.[0]?.finishReason || j?.promptFeedback?.blockReason || 'no_content';
    throw new Error(`gemini_empty: ${reason}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (e) {
    throw new Error('gemini_bad_json');
  }
  return {
    en: (parsed.en || '').trim(),
    zh: (parsed.zh || '').trim(),
    ja: (parsed.ja || '').trim(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // 키가 아직 설정되지 않았음 → 클라이언트가 무키 폴백(Google)으로 넘어가도록 신호
    return res.status(503).json({ error: 'no_api_key', engine: 'gemini' });
  }

  // body 파싱 (Vercel Node 함수는 보통 자동 파싱하지만, 문자열로 올 때도 방어)
  let text = '';
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    text = typeof b.text === 'string' ? b.text : '';
  } catch (e) {
    return res.status(400).json({ error: 'bad_request' });
  }

  text = text.trim();
  if (!text) return res.status(400).json({ error: 'empty_text' });
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  const cached = cacheGet(text);
  if (cached) {
    return res.status(200).json({ translations: cached, engine: 'gemini', cached: true });
  }

  try {
    const g = await callGemini(text, apiKey);
    const translations = { en: g.en, 'zh-CN': g.zh, ja: g.ja };
    cacheSet(text, translations);
    return res.status(200).json({ translations, engine: 'gemini', cached: false });
  } catch (err) {
    console.error('[translate] gemini failed:', err.message);
    // 서버에서 실패해도 앱이 멈추지 않도록 502 → 클라이언트가 무키 폴백 수행
    return res.status(502).json({ error: 'gemini_failed', detail: err.message, engine: 'gemini' });
  }
}
