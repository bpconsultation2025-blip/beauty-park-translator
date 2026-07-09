# v2.0 업그레이드 노트 — 번역 엔진을 Gemini로 교체

## 🔤 번역 엔진 교체

| 항목 | 이전 (v1.x) | 현재 (v2.0) |
|---|---|---|
| 번역 엔진 | MyMemory → DeepL → Google(비공식) 3단 폴백 | **Google Gemini AI** (1순위) |
| 상담 맥락 이해 | 없음 (일반 번역) | 미용·성형 클리닉 맥락 + 의료 톤 프롬프트 |
| 호출 방식 | 언어별 개별 호출 | **3개 언어를 한 번에** 번역 |
| 폴백 | — | Gemini 실패 시 Google(무키) 자동 대체 |

## 🔒 보안 강화 (중요)

- 이전 `consultation-translator.html` 에는 **DeepL API 키가 브라우저 코드에 그대로 노출**돼 있었습니다.
  (`const DEEPL_API_KEY = '...'`) → 누구나 소스 보기로 확인 가능한 상태였습니다.
- v2.0에서는:
  - 이 DeepL 키와 관련 코드를 **완전히 제거**했습니다.
  - Gemini 키는 **서버 함수(`api/translate.js`)에서만** 사용하며, 브라우저로 전송되지 않습니다.

> ⚠️ **꼭 하세요:** 기존에 노출됐던 DeepL 키
> `a65d6eb2-...:fx` 는 이미 공개 이력에 남아 있으므로 **DeepL 계정에서 폐기(Revoke)** 하시길 권장합니다.
> (https://www.deepl.com/account → API keys → 해당 키 삭제)

## 🧹 프로젝트 구조 정리

실제로는 빌드되지 않던(참조 코드 부재) Next.js + Firebase 껍데기를 정리했습니다.

- 제거: `next.config.mjs`, `middleware.js`, `firestore.rules`, `tailwind.config.js`,
  `postcss.config.mjs`, `jsconfig.json`, 중복된 `consultation-translator.html`
- 추가: `api/translate.js` (Gemini 프록시), `vercel.json`
- 앱 본체는 `index.html` 하나 (정적) + 서버리스 함수 하나로 단순화

## 🔧 환경변수 변화

| 이전 (8개) | 현재 (1개) |
|---|---|
| `ANTHROPIC_API_KEY` + Firebase 6개 + `AUTH_SECRET` | **`GEMINI_API_KEY`** 하나만 |
| | (선택) `GEMINI_MODEL` — 기본 `gemini-2.5-flash` |

## 🧪 배포 후 검증

- [ ] PC에서 한글 입력 → 영/중/일 번역 표시, 하단에 `GEMINI ·` 표기
- [ ] 태블릿에서 같은 방 번호 접속 → 2~3초 내 반영
- [ ] `FALLBACK ·` 으로 뜨면 `GEMINI_API_KEY` 재확인 후 Redeploy
