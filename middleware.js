/**
 * Edge Middleware — 병원 IP 접속 제한
 * ------------------------------------------------------------
 * 허용된 IP(병원 공인 IP)에서 들어온 요청만 사이트/API 접근을 허용합니다.
 * 그 외 IP는 403 안내 화면을 보여줍니다. (사이트 HTML + /api/translate 모두 보호)
 *
 * ▶ 허용 IP 설정 방법 (둘 중 아무거나)
 *   1) Vercel 환경변수 ALLOWED_IPS 에 쉼표로 구분해 입력 (권장 — 코드 수정 없이 변경 가능)
 *      예: ALLOWED_IPS = "123.45.67.89, 2001:db8::1"
 *   2) 아래 FALLBACK_ALLOWED_IPS 배열에 직접 입력
 *
 * ▶ 안전장치 (직원이 실수로 잠기는 것을 방지)
 *   - 허용 목록이 비어 있으면(미설정) 전체 허용(fail-open)
 *   - 미들웨어 처리 중 오류가 나면 접속을 막지 않고 통과(fail-open)
 *
 * ⚠️ 참고
 *   - 병원 인터넷 공인 IP가 '고정 IP'가 아니면(대부분 유동 IP) 통신사 사정으로
 *     IP가 바뀔 수 있고, 그러면 접속이 막힙니다. 그때는 새 IP로 갱신해야 합니다.
 *   - IPv4 / IPv6 주소가 다를 수 있습니다. 실제 태블릿이 접속하는 주소를 넣어야 합니다.
 */

// 병원 공인 IP를 여기에 넣으세요 (IPv4/IPv6 모두 가능). 예: ['123.45.67.89', '2001:db8::1']
const FALLBACK_ALLOWED_IPS = [];

function getAllowList() {
  const fromEnv =
    (typeof process !== 'undefined' && process.env && process.env.ALLOWED_IPS) || '';
  const raw = fromEnv || FALLBACK_ALLOWED_IPS.join(',');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function clientIp(request) {
  // Vercel은 실제 클라이언트 IP를 x-real-ip 로 전달 (백업: x-forwarded-for 의 첫 항목)
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = request.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || '').trim();
}

const BLOCK_HTML = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>접속 제한</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0b0b0c;color:#efe8dd;font-family:"Noto Sans KR",-apple-system,sans-serif;text-align:center;padding:24px}
  .card{max-width:420px;border:1px solid #2d2d35;border-radius:6px;padding:40px 32px;background:#1a1a1f}
  .mark{color:#b09a82;letter-spacing:6px;font-size:11px;margin-bottom:16px}
  h1{font-size:20px;margin:0 0 12px;color:#efe8dd}
  p{font-size:14px;line-height:1.8;color:#a9a29a;margin:0}
  .en{color:#8d7a64;letter-spacing:3px;font-size:12px;margin-top:20px}
</style></head>
<body><div class="card">
  <div class="mark">◆ BEAUTY PARK ◆</div>
  <h1>병원 네트워크에서만 접속 가능합니다</h1>
  <p>이 페이지는 뷰티파크의원 내부 네트워크(병원 Wi-Fi)에서만 열 수 있습니다.<br>
     태블릿·PC가 <b>병원 Wi-Fi에 연결</b>되어 있는지 확인해 주세요.<br>
     (셀룰러 데이터/외부망에서는 접속이 제한됩니다.)</p>
  <div class="en">ACCESS RESTRICTED</div>
</div></body></html>`;

export default function middleware(request) {
  try {
    const allow = getAllowList();
    if (allow.length === 0) return; // 미설정 → 전체 허용(fail-open)
    const ip = clientIp(request);
    if (ip && allow.includes(ip)) return; // 허용 IP → 통과
    return new Response(BLOCK_HTML, {
      status: 403,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  } catch (e) {
    return; // 오류 시 통과(직원 잠금 방지)
  }
}
