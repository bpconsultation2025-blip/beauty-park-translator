# Beauty Park Translator

뷰티파크의원 범어점 실시간 진료 번역 시스템 · Production v1.1

Real-time Korean → English / Japanese / Simplified Chinese translation for staff–patient communication in an aesthetic medical clinic.

## Stack

- **Next.js 14** (App Router, Node runtime)
- **Firebase Firestore** — real-time sync between PC and tablet
- **Firebase Anonymous Auth** — gate for Firestore rules
- **Anthropic Claude Sonnet 4.5** — medical-tone translation
- **Tailwind CSS** · `next/font` (Cormorant Garamond, Noto Serif KR / JP / SC)
- **Vercel** deployment

## Production-grade features (v1.1)

- HMAC-signed room auth cookie (12h TTL) — clinic-set password per room
- Firestore rules scoped to authenticated anonymous users + strict path/shape validation
- `/api/translate` rate-limited (30 req/min per room) with 5-minute in-memory LRU cache
- Input length capped at 500 characters
- `robots: noindex` + security headers (HSTS, X-Frame-Options, Permissions-Policy)
- Presence heartbeat with `beforeunload` cleanup
- "Edit before send" toggle for template messages

## Quick start (local dev)

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your Anthropic + Firebase keys
npm run dev
# Open http://localhost:3000
```

See `DEPLOYMENT_GUIDE.md` for the full Korean deployment walkthrough.

## Configuration

| What to edit | Where |
|---|---|
| Rooms & passwords | `lib/rooms.js` |
| Common phrase templates | `lib/config.js` |
| Target languages | `lib/config.js` |
| Translation prompt / tone | `app/api/translate/route.js` |
| Firestore rules | `firestore.rules` (paste into Firebase console) |

## License

Private · 뷰티파크의원 내부 사용
