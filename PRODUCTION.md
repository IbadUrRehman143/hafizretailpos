# Hafiz Retail POS — Production Runbook
1. Put real values from `.env.example` in the host secret manager; never commit `.env`.
2. Use managed PostgreSQL with TLS, least-privilege credentials and automatic provider snapshots.
3. Run `npm ci`, `npm run contract:emit`, `npm run build`, then `npm start`, or use the Dockerfile.
4. Put the app behind HTTPS and set `NEXT_PUBLIC_APP_URL` to the final domain.
5. Configure WhatsApp Cloud API + SMS credentials. WhatsApp webhook: `/api/messages/webhook`.
6. Schedule `npm run db:backup` daily to encrypted off-site storage. Test restore monthly on non-production DB with `npm run db:restore -- <dump>`.
7. Before release run `npm test`, `npm run lint`, `npm run security:check`, and `npm run build`.
8. Monitor HTTP 5xx, DB availability, failed MessageLog rows, CPU/memory and backup success.
9. First admin: POST `/api/auth/bootstrap` with email/password and `AUTH_BOOTSTRAP_KEY`; rotate bootstrap key afterward.
