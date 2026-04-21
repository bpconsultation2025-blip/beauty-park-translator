# 🚀 뷰티파크 번역 시스템 배포 가이드

> 개발자가 아니어도 따라 할 수 있도록 최대한 자세히 썼습니다.  
> 총 소요 시간: **1~2시간**  
> 월 운영비: **약 5,000~15,000원** (Anthropic API 비용만)

---

## 📋 준비물 체크리스트

배포를 시작하기 전에 다음을 준비해주세요.

- [ ] **이메일 계정** (Google 계정 추천 — Firebase·Vercel 모두에 사용)
- [ ] **신용카드** (Anthropic API 결제용, 소액 선결제)
- [ ] **PC** (배포 작업용, 상담실 PC가 아니어도 OK)

아무 프로그램도 설치할 필요 없어요. 전부 웹 브라우저에서 진행합니다.

---

## 전체 흐름 (큰 그림)

```
1. Anthropic API 키 발급      ← 번역 엔진
2. Firebase 프로젝트 만들기    ← PC ↔ 태블릿 실시간 연결
3. GitHub에 코드 올리기        ← 코드 저장소
4. Vercel에 배포               ← 실제 웹사이트 공개
5. 환경변수 입력               ← 연결고리
6. 테스트!
```

---

# STEP 1 · Anthropic API 키 발급 (약 10분)

번역 엔진으로 사용할 Claude API를 발급받습니다.

### 1-1. 계정 만들기

1. https://console.anthropic.com 접속
2. "Sign Up" → 이메일로 가입
3. 이메일 인증 완료

### 1-2. 결제 정보 등록

1. 왼쪽 메뉴 **"Billing"** 클릭
2. **"Add credit"** 또는 **"Buy credits"** 클릭
3. 신용카드 등록
4. **$10 (약 14,000원)** 선결제
   - 이 정도면 클리닉 기준 **2~4개월 사용 가능**해요
   - 잔액이 부족해지면 이메일로 알림 옴

### 1-3. API 키 발급

1. 왼쪽 메뉴 **"API Keys"** 클릭
2. **"Create Key"** 버튼 클릭
3. 이름 입력: `beautypark-translator`
4. 생성된 **`sk-ant-api03-...`** 로 시작하는 긴 문자열을 복사

> ⚠️ **중요:** 이 키는 단 한 번만 보여집니다. 메모장에 복사해두세요.  
> 나중에 다시 볼 수 없으면 삭제하고 새로 발급받으면 됩니다.

✅ **STEP 1 완료 결과물:** `sk-ant-api03-xxxxx...` API 키

---

# STEP 2 · Firebase 프로젝트 만들기 (약 15분)

PC와 태블릿 사이에 번역문을 실시간으로 전달할 데이터베이스를 만듭니다. **완전 무료**예요.

### 2-1. Firebase 가입 및 프로젝트 생성

1. https://console.firebase.google.com 접속 (Google 계정으로 로그인)
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `beautypark-translator` (소문자, 하이픈 가능)
4. **Google Analytics 사용 설정: 끄기** (필요 없음)
5. **"프로젝트 만들기"** 클릭 → 30초 대기

### 2-2. 웹앱 등록

1. 프로젝트 대시보드에서 **웹 아이콘 `</>`** 클릭 ("앱에 Firebase를 추가하여 시작하기" 섹션)
2. 앱 닉네임: `bp-translator-web`
3. "이 앱의 Firebase 호스팅도 설정" **체크 해제** (Vercel 쓸 거라 필요 없음)
4. **"앱 등록"** 클릭
5. 화면에 나타나는 `firebaseConfig` 객체의 **6개 값을 전부 복사**해두세요:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                          // ← 복사
  authDomain: "beautypark-xxx.firebaseapp.com", // ← 복사
  projectId: "beautypark-xxx",                  // ← 복사
  storageBucket: "beautypark-xxx.appspot.com",  // ← 복사
  messagingSenderId: "1234567890",              // ← 복사
  appId: "1:123:web:abc..."                     // ← 복사
};
```

6. **"콘솔로 이동"** 클릭

### 2-3. Firestore 데이터베이스 활성화

1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. **"프로덕션 모드로 시작"** 선택 (테스트 모드 ❌)
4. 위치: **`asia-northeast3 (Seoul)`** 선택 ⭐ (한국 서버, 속도 빠름)
5. **"사용 설정"** 클릭 → 1분 대기

### 2-4. 익명 인증(Anonymous Auth) 활성화 ⭐ (프로덕션 필수)

1. Firebase 왼쪽 메뉴에서 **"Authentication"** 클릭
2. **"시작하기"** 클릭
3. 상단 탭 **"Sign-in method"** 선택
4. 제공업체 목록에서 **"익명"** 클릭 → 토글을 **"사용 설정"** → **"저장"**

> 💡 **왜 필요한가?** 다음 단계의 보안 규칙이 "로그인한 사용자만 접근 가능"으로 강화되어 있습니다. 익명 인증은 환자·직원이 따로 뭘 입력할 필요 없이 페이지 접속 시 자동으로 발급됩니다.

### 2-5. 보안 규칙 설정 (프로덕션)

1. Firestore 화면 상단 **"규칙"** 탭 클릭
2. 프로젝트의 **`firestore.rules` 파일 내용을 전체 복사**해서 붙여넣기 (기존 내용 덮어쓰기)
3. **"게시"** 버튼 클릭

이 규칙이 하는 일:
- Firebase 익명 인증된 사용자만 읽기/쓰기 허용
- `/rooms/{roomId}` 하위 `state`, `presence` 경로만 허용
- presence 문서는 `pc` 또는 `tablet` deviceId + `lastPing` 숫자 필드만 허용
- 그 외 모든 경로는 차단

✅ **STEP 2 완료 결과물:** Firebase 설정 6개 값 + Firestore + 익명 인증 + 프로덕션 보안 규칙

---

# STEP 3 · GitHub에 코드 올리기 (약 15분)

### 3-1. GitHub 가입

1. https://github.com 접속
2. **"Sign up"** → 이메일로 가입

### 3-2. 코드 업로드

두 가지 방법이 있는데 **Option A가 훨씬 쉬워요.**

#### Option A: 웹에서 직접 업로드 (추천 ⭐)

1. GitHub에서 **"New repository"** 클릭 (오른쪽 위 `+` → `New repository`)
2. Repository name: `bp-translator`
3. **Private** 선택 ⭐ (비밀번호 등이 코드에 있진 않지만 안전하게)
4. **"Create repository"** 클릭

5. 만들어진 저장소에서 **"uploading an existing file"** 링크 클릭  
   (또는 "Add file" → "Upload files")

6. 제가 드린 **bp-translator 폴더의 모든 파일**을 드래그해서 올리기
   - `node_modules` 폴더는 있으면 제외 (없어야 정상)
   - `.env`, `.env.local` 파일은 절대 올리지 마세요 ⚠️

7. 아래쪽 **"Commit changes"** 클릭

#### Option B: GitHub Desktop 사용 (Git 익숙하신 분만)

https://desktop.github.com 다운로드 → 로그인 → 로컬 폴더 clone → 파일 복사 → commit → push

✅ **STEP 3 완료 결과물:** GitHub에 올라간 `bp-translator` 저장소

---

# STEP 4 · Vercel에 배포 (약 15분)

드디어 실제로 웹사이트를 인터넷에 공개하는 단계입니다.

### 4-1. Vercel 가입

1. https://vercel.com 접속
2. **"Sign Up"** → **"Continue with GitHub"** 선택 ⭐
3. GitHub 계정으로 로그인 및 권한 허용

### 4-2. 프로젝트 임포트

1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 목록에서 **`bp-translator`** 찾기 → **"Import"** 클릭
   - 목록에 안 보이면 "Adjust GitHub App Permissions" → 권한 추가

3. Framework Preset: **Next.js** (자동 감지됨)
4. **"Environment Variables"** 섹션 펼치기 ⭐ 아래 참고

### 4-3. 환경변수 입력 (가장 중요!)

아래 8개 항목을 **하나씩** 추가하세요. Key와 Value를 정확히 입력:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | STEP 1에서 받은 `sk-ant-api03-...` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | STEP 2-2의 `apiKey` 값 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | STEP 2-2의 `authDomain` 값 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | STEP 2-2의 `projectId` 값 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | STEP 2-2의 `storageBucket` 값 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | STEP 2-2의 `messagingSenderId` 값 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | STEP 2-2의 `appId` 값 |
| `AUTH_SECRET` | 아무 긴 문자열 (예: `bp-secret-2026-very-long-random-string-here-32chars`) |

> 💡 입력할 때 따옴표 `"`는 포함하지 마세요.

5. 모두 입력 후 **"Deploy"** 클릭
6. 약 2분 대기... ☕
7. **"Congratulations!"** 화면이 나오면 성공!

### 4-4. 주소 확인

배포가 완료되면 `https://bp-translator-xxxx.vercel.app` 같은 주소가 생성됩니다. 이게 클리닉에서 접속할 주소예요.

✅ **STEP 4 완료 결과물:** 실제 작동하는 웹사이트 URL

---

# STEP 5 · 테스트 🧪

### 5-1. 브라우저에서 열기

1. Vercel이 준 URL을 열어보세요
2. **"상담실 1" ~ "데스크"** 4개 버튼이 보여야 함
3. "상담실 1" 클릭 → 비밀번호 **`bp1001`** 입력
4. "송신 화면 (PC)" 선택 → 번역 화면 뜸
5. 한글로 아무거나 입력해보기 → **번역 & 전송** 클릭

### 5-2. 태블릿에서 테스트

1. 태블릿 크롬에서 같은 URL 접속
2. **상담실 1** 선택 → **같은 비밀번호** 입력
3. **"수신 화면 (TABLET)"** 선택
4. PC에서 메시지 보낸 게 몇 초 안에 태블릿 화면에 뜨면 성공! 🎉

---

# 📚 일상 운영 가이드

## 비밀번호 바꾸기

1. GitHub에서 `lib/rooms.js` 파일 열기
2. 오른쪽 위 **연필 아이콘** 클릭 (편집)
3. `password: 'bp1001'` 부분을 원하는 값으로 수정
4. 아래 **"Commit changes"** 클릭
5. ✨ **Vercel이 자동으로 재배포** (약 1~2분) → 바로 적용!

> 💡 **추천:** 매주 월요일 아침에 바꾸시면 보안상 좋아요.

## 상담실 추가하기

`lib/rooms.js` 파일에 한 줄 추가:

```javascript
{ id: 'room4', name: '상담실 4', password: 'bp1004' },
```

## 템플릿 문장 수정·추가하기

`lib/config.js` 파일에서 `TEMPLATES` 배열 수정. 형식만 맞추면 됩니다.

## 도메인 연결하기 (선택)

기본 주소 대신 `translate.beautypark.kr` 같은 클리닉 도메인을 쓰고 싶으시면:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력 → Vercel이 안내하는 DNS 설정
3. 도메인은 가비아·카페24·Namecheap 등에서 연 1~2만원

## 사용량·비용 모니터링

- **Anthropic**: https://console.anthropic.com → Usage
- **Firebase**: 무료 한도 매우 넉넉 (하루 5만 건)
- **Vercel**: Hobby 플랜 무료 (상업용은 Pro $20/월 필요 여부는 사용량에 따라)

> ⚠️ **Vercel 상업용 주의:** 엄밀히 말하면 병원도 "상업용"이므로 **Pro 플랜(월 $20)** 권장.  
> 무료로 쓰셔도 당장 막히진 않지만, 사용량이 많아지면 경고 올 수 있어요.

---

# 🆘 문제 해결

### 배포 후 "500 Error" 뜸
→ 환경변수 8개가 모두 제대로 입력됐는지 확인. 오타 1개만 있어도 실패.

### 태블릿에 번역문이 안 뜸
→ Firebase Firestore 활성화 확인. 브라우저 개발자 도구(F12)에서 에러 확인.

### "비밀번호가 올바르지 않습니다"
→ `lib/rooms.js`의 비밀번호를 확인. 대소문자 구분함.

### 번역이 안 됨 ("번역 오류")
→ Anthropic 잔액 확인. API 키 재확인.

### 더 복잡한 문제
→ 이 가이드 만든 Claude에게 물어보세요! 스크린샷 같이 올리면 훨씬 빠르게 해결됩니다.

---

# 💰 운영비 요약

| 항목 | 월 비용 | 비고 |
|------|---------|------|
| Anthropic API | 5,000~15,000원 | 사용량 기반 |
| Firebase | 무료 | 한도 매우 넉넉함 |
| Vercel Hobby | 무료 | 개인/학습용 |
| Vercel Pro (추천) | 약 28,000원 | 상업용 (선택) |
| 도메인 (선택) | 연 1~2만원 | translate.beautypark.kr 등 |

**최소**: 월 5천 원 수준  
**권장**: 월 3~4만 원 수준 (Vercel Pro 포함)

---

**만드느라 고생하셨어요! 이제 일본·중국 의료관광 시대에 완벽 대비되셨습니다 🌸**
