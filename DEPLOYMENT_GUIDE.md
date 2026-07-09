# 🚀 뷰티파크 번역 시스템 배포 가이드 (v2.0 · Gemini)

> 개발자가 아니어도 따라 할 수 있도록 최대한 자세히 썼습니다.
> 총 소요 시간: **약 30분**
> 월 운영비: **거의 무료** (Gemini 무료 한도 + Vercel Hobby)

---

## 📋 준비물

- [ ] **Google 계정** (Gemini 키 발급 + Vercel 로그인에 사용)
- [ ] **GitHub 계정** (코드 저장소 — 이미 있음)
- [ ] **PC** (배포 작업용)

프로그램 설치는 필요 없습니다. 전부 웹 브라우저에서 진행합니다.

---

## 전체 흐름 (큰 그림)

```
1. Gemini API 키 발급        ← 번역 엔진 (무료)
2. GitHub 저장소 준비          ← 이미 되어 있음
3. Vercel에 배포               ← 실제 웹사이트 공개
4. 환경변수 GEMINI_API_KEY 입력 ← 번역 엔진 연결
5. 테스트!
```

> 💡 이전 버전과 달리 **Firebase / Anthropic 설정이 필요 없습니다.**
> 입력할 환경변수는 `GEMINI_API_KEY` **딱 하나**입니다.

---

# STEP 1 · Gemini API 키 발급 (약 5분, 무료)

번역 엔진으로 사용할 Google Gemini API 키를 발급받습니다.

1. https://aistudio.google.com/apikey 접속 (Google 계정으로 로그인)
2. **"Create API key"** (API 키 만들기) 클릭
3. 프로젝트를 고르라고 하면 아무거나 선택 (또는 새로 만들기)
4. 생성된 **`AIza...` 로 시작하는 키**를 복사해서 메모장에 보관

> 💡 **비용:** Gemini는 넉넉한 무료 한도가 있어 클리닉 사용량 정도는 대부분 무료입니다.
> 사용량이 많아지면 Google AI Studio에서 유료(종량제)로 전환할 수 있습니다.

✅ **STEP 1 결과물:** `AIza...` 로 시작하는 Gemini API 키

---

# STEP 2 · GitHub 저장소 준비

이 프로젝트는 이미 GitHub에 올라가 있습니다. (`beauty-park-translator`)
새 버전 코드는 브랜치에 반영되어 있으니, PR을 **main에 병합**하면 준비 완료입니다.

> 처음부터 직접 올리는 경우: GitHub에서 New repository → 이 폴더의 모든 파일 업로드.
> ⚠️ `.env`, `.env.local` 파일은 **절대 올리지 마세요** (키가 들어있음).

---

# STEP 3 · Vercel에 배포 (약 10분)

### 3-1. Vercel 가입 / 로그인

1. https://vercel.com 접속
2. **"Sign Up"** → **"Continue with GitHub"** 선택
3. GitHub 계정으로 로그인 및 권한 허용

### 3-2. 프로젝트 임포트

1. Vercel 대시보드 → **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 목록에서 **`beauty-park-translator`** 찾기 → **"Import"**
   - 목록에 안 보이면 "Adjust GitHub App Permissions"로 권한 추가
3. **Project Name(프로젝트 이름)을 `beautypark-translator` 로 입력** ⭐
   - 이 이름이 곧 주소가 됩니다 → `beautypark-translator.vercel.app`
4. **Framework Preset:** `Other` (자동 감지됨 — 별도 빌드 설정 불필요)

### 3-3. 환경변수 입력 (가장 중요!)

**"Environment Variables"** 섹션을 펼치고 아래 **한 개**를 추가:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | STEP 1에서 복사한 `AIza...` 키 |

> 💡 따옴표 `"` 없이 값만 붙여넣으세요.
> (선택) 모델을 바꾸고 싶으면 `GEMINI_MODEL` = `gemini-2.5-flash` 추가.

### 3-4. 배포

1. **"Deploy"** 클릭
2. 약 1분 대기 ☕
3. **"Congratulations!"** 화면이 뜨면 성공!
4. 주소 확인: **`https://beautypark-translator.vercel.app`**

✅ **STEP 3 결과물:** 실제 작동하는 웹사이트 URL

---

# STEP 4 · 테스트 🧪

### 4-1. PC(상담실)에서

1. `https://beautypark-translator.vercel.app` 접속
2. **"상담실 PC"** 선택 → 방 번호 4자리 이상 입력 (예: `1001`) → **시작**
3. 한글로 입력해보기 → 오른쪽 미리보기에 영/중/일 번역이 뜨는지 확인
   - 하단에 `GEMINI · LAST UPDATE ...` 라고 뜨면 Gemini 번역 성공
   - `FALLBACK · ...` 이라고 뜨면 Gemini 키에 문제가 있다는 뜻 → STEP 1·3-3 재확인

### 4-2. 태블릿(환자)에서

1. 태블릿 크롬에서 **같은 URL** 접속
2. **"환자 태블릿"** 선택 → **PC와 똑같은 방 번호** 입력 → **시작**
3. PC에서 입력한 내용이 몇 초 안에 태블릿 화면에 크게 뜨면 성공! 🎉
4. 상단 언어 탭(English / 中文 / 日本語 / 한국어)으로 표시 언어 전환

> 📶 PC와 태블릿은 PeerJS(P2P)로 직접 연결됩니다. 같은 방 번호를 쓰면 됩니다.
> 방화벽이 심한 네트워크에서는 연결이 지연될 수 있으니, 가능하면 같은 Wi-Fi를 권장합니다.

---

# 📚 일상 운영 가이드

## 템플릿(자주 쓰는 멘트) 수정

1. GitHub에서 `index.html` 열기 → 연필 아이콘(편집)
2. `const TEMPLATES = [` 부분에서 문장 추가/수정
3. **"Commit changes"** → Vercel이 자동 재배포 (1~2분)

## 번역 톤 / 의료 용어 지침 바꾸기

`api/translate.js` 의 `SYSTEM_PROMPT` 를 수정하면 번역 스타일이 바뀝니다.

## 도메인 연결하기 (선택)

`translate.beautypark.kr` 같은 클리닉 도메인을 쓰고 싶으면:
Vercel 프로젝트 → **Settings** → **Domains** → 도메인 입력 후 안내대로 DNS 설정.

## 사용량·비용 모니터링

- **Gemini**: https://aistudio.google.com → 사용량 확인 (무료 한도 넉넉)
- **Vercel**: Hobby 플랜 무료. 상업용은 Pro($20/월) 권장.

---

# 🆘 문제 해결

### 번역이 `FALLBACK` 으로만 나옴
→ Vercel 환경변수 `GEMINI_API_KEY` 오타 확인. 키 수정 후 **재배포** 필요
   (Vercel → Deployments → 최신 배포 → Redeploy).

### 배포 후 화면은 뜨는데 번역이 안 됨
→ 브라우저 개발자도구(F12) → Network 탭에서 `/api/translate` 응답 확인.
   `no_api_key` → 키 미설정, `gemini_failed` → 키/한도 문제.

### 태블릿에 내용이 안 뜸
→ PC와 태블릿의 **방 번호가 같은지** 확인. 새로고침 후 재연결.

### 더 복잡한 문제
→ 이 프로젝트를 만든 Claude에게 스크린샷과 함께 물어보세요.

---

# 💰 운영비 요약

| 항목 | 월 비용 | 비고 |
|------|---------|------|
| Gemini API | 대부분 무료 | 무료 한도 초과 시 종량제 |
| Vercel Hobby | 무료 | 개인/소규모 |
| Vercel Pro (선택) | 약 28,000원 | 상업용 권장 |
| 도메인 (선택) | 연 1~2만원 | translate.beautypark.kr 등 |

**만드느라 고생하셨어요! 일본·중국 의료관광 시대에 완벽 대비되셨습니다 🌸**
