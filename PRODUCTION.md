# Hafiz Retail POS - Production Checklist

## Local testing without HTTPS
Set `COOKIE_SECURE=false` and use `http://localhost:3000`. This is intentionally supported for local development only.
Demo login in development: `admin@hafizpos.local` / `Hafiz@12345`.
The demo admin is created automatically on first login if it does not already exist.

## Before go-live
1. Set a strong unique `AUTH_SECRET`.
2. Set `COOKIE_SECURE=true` only after HTTPS is active.
3. Change/remove demo credentials and set real staff passwords.
4. Configure WhatsApp/SMS credentials and set `MESSAGE_DEMO_MODE=false`.
5. Run `npm run test` and `npm run build`.
6. Run `npm run db:backup` and verify a restore with `npm run db:restore -- backups/<file>.sql` on a non-production database.
7. Put the app behind HTTPS and monitor `/api/health`.

## Messaging
`MESSAGE_DEMO_MODE=true` lets UI/API flows be tested without sending real messages. WhatsApp uses Meta Graph API when credentials are configured. SMS uses the configurable `SMS_API_URL`; adapt payload if your provider requires different fields.

## Mobile admin
`/dashboard/mobile` is a responsive/PWA admin entry point using the same secured APIs and database. A native iOS/Android binary is not produced by this Next.js source package.
