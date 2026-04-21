# v1.1 프로덕션 업그레이드 노트

기존 rudimentary 버전을 이 코드로 교체하면 아래 항목들이 적용됩니다.

## 🔒 보안 강화

| 항목 | 이전 | 현재 (v1.1) |
|---|---|---|
| Firestore 규칙 | 누구나 read/write | 익명 인증된 사용자만, 경로/필드/타입 검증 |
| Firebase Auth | 없음 | 익명 인증 자동 처리 (`ensureAnonAuth`) |
| API Rate Limit | 없음 | `/api/translate` 방당 분당 30건 |
| Input 길이 제한 | 없음 | 서버·클라이언트 모두 500자 캡 |
| 검색엔진 노출 | 가능 | `robots: noindex` + `X-Robots-Tag` |
| 보안 헤더 | 없음 | HSTS, X-Frame-Options, Permissions-Policy 등 |

## 💰 비용 최적화

- **번역 캐시**: 동일 문장은 5분간 재호출 안 함 → 템플릿 버튼 연타 시 비용 절약
- **LRU**: 최대 500개 항목 유지, 오래된 항목 자동 폐기

## 🎨 UX 개선

- 템플릿 패널에 "편집 후 전송" 토글 추가
- 입력 글자수 카운터 (500자 기준, 90% 넘으면 경고 색상)
- 페이지 이동 시 presence 즉시 정리 → 상대 기기에 "대기중" 표시 정확화

## ⚡ 성능

- `next/font/google`로 폰트 자체 호스팅 → FOUT/FOIT 감소, 외부 요청 제거
- API routes에 `runtime = 'nodejs'` 명시 → 명확한 런타임 결정

## ⚠️ 배포 시 주의

기존 Firebase 프로젝트에 이 코드를 연결할 때:

1. **Firebase Console → Authentication → 익명 로그인 활성화** (STEP 2-4 참고)
2. **Firestore 규칙을 `firestore.rules` 내용으로 교체** (STEP 2-5 참고)
3. Vercel 환경변수는 변경 없음 (기존 8개 그대로)
4. Vercel은 main 브랜치 push 감지 후 자동 재배포

## 🧪 배포 후 검증

배포 직후 반드시 확인:
- [ ] PC에서 로그인 → 번역 전송 → 성공
- [ ] 태블릿에서 수신 화면 → PC의 전송 내용이 2초 이내 반영
- [ ] 브라우저 DevTools Network 탭에서 `X-Robots-Tag: noindex` 응답 헤더 확인
- [ ] 같은 문장 2회 전송 시 두 번째는 `cached: true` 응답 (DevTools Network → /api/translate 응답)
- [ ] 31번째 요청에서 429 에러 (rate limit) 정상 동작
