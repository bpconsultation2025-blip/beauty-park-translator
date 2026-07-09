# Beauty Park Translator

뷰티파크의원 범어점 실시간 진료 번역 시스템 · v2.0 (Gemini)

상담실 PC에서 입력한 한국어를 환자용 태블릿에 실시간으로 **영어 / 중국어(간체) / 일본어**로 번역해 보여줍니다.

## 무엇이 바뀌었나 (v2.0)

- **번역 엔진 → Google Gemini AI** 로 교체
  - 기존 MyMemory / DeepL / Google(비공식) 3단 폴백 → 미용·성형 상담 맥락을 이해하는 Gemini 로 업그레이드
  - 보톡스·필러·리프팅 등 의료 용어와 정중한 환자 응대 톤을 살린 자연스러운 번역
  - 3개 언어를 **한 번의 호출**로 번역 → 빠르고 저렴
- **API 키 보안 강화**
  - 이전 버전은 DeepL 키가 브라우저 코드에 그대로 노출돼 있었음 ⚠️ (제거됨)
  - Gemini 키는 서버 함수(`/api/translate`)에서만 사용 → 브라우저로 절대 노출되지 않음
- **자동 폴백**: Gemini가 실패하거나 키가 아직 없어도 Google(무키) 번역으로 자동 대체 → 화면이 멈추지 않음

## 구성

- **정적 프론트엔드** `index.html` — 단일 파일 (HTML · CSS · JS)
- **PeerJS (P2P)** — PC ↔ 태블릿을 방 번호로 직접 연결 (별도 서버·DB 불필요)
- **Vercel 서버리스 함수** `api/translate.js` — Gemini 번역 프록시 (키 보관)
- **Vercel** 배포 (정적 + 서버리스 함수)

## 동작 방식

```
[상담실 PC]  한국어 입력
     │  (0.5초 디바운스)
     ├─▶ POST /api/translate  ──▶  Gemini  ──▶  { en, zh, ja }
     │        (Vercel 서버, 키 보관)
     └─▶ PeerJS 로 태블릿에 번역 결과 실시간 전송
                                   │
                            [환자 태블릿]  선택한 언어로 크게 표시
```

## 빠른 시작 (로컬)

```bash
# 1) Gemini 키 준비 (https://aistudio.google.com/apikey)
cp .env.example .env.local     # GEMINI_API_KEY 채우기

# 2) Vercel CLI 로 로컬 실행 (서버 함수 포함)
npx vercel dev
# http://localhost:3000 접속
```

> `index.html` 파일만 브라우저로 열어도 UI와 P2P는 동작하지만, `/api/translate`(Gemini)는
> 서버가 필요하므로 이때는 자동으로 Google 폴백 번역이 사용됩니다.

## 배포

`beautypark-translator.vercel.app` 배포 방법은 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** 참고
(개발자가 아니어도 따라 할 수 있게 한국어로 자세히 정리).

핵심 요약:
1. GitHub 저장소를 Vercel에 Import (프로젝트 이름 = `beautypark-translator`)
2. 환경변수 `GEMINI_API_KEY` 하나만 입력
3. Deploy → `https://beautypark-translator.vercel.app`

## 설정 바꾸기

| 무엇을 | 어디서 |
|---|---|
| 자주 쓰는 멘트(템플릿) | `index.html` 의 `TEMPLATES` 배열 |
| 번역 톤·의료 용어 지침 | `api/translate.js` 의 `SYSTEM_PROMPT` |
| Gemini 모델 | 환경변수 `GEMINI_MODEL` (기본 `gemini-2.5-flash`) |
| 대상 언어 | `index.html` 의 `LANGS` / `api/translate.js` 스키마 |

## License

Private · 뷰티파크의원 내부 사용
