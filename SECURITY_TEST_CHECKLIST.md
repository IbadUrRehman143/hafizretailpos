# Security & QA Gate

Run against a staging database before production.

- Authentication: wrong password rejected; inactive user rejected; logout clears cookie; expired/tampered cookie rejected.
- RBAC: for each role test view/create/edit/delete/export on every assigned module; direct API calls must return 403 when denied.
- Sales: normal sale, insufficient stock, duplicate submit, cancellation/return, customer credit and receipt.
- Purchases: normal purchase, stock increase, supplier payable and supplier payment, overpayment blocked.
- Inventory: sale/purchase/return/adjustment transaction consistency and no negative stock.
- Payments: customer/supplier overpayment blocked; payment-only actions do not change stock.
- Messaging: WhatsApp success, WhatsApp failure -> SMS fallback, provider failure recorded in Audit Logs.
- Input/error handling: invalid IDs, empty bodies, malformed JSON, duplicate email/category/product codes where applicable.
- Production: `npm run lint`, `npm run build`, HTTPS, strong AUTH_SECRET, least-privilege DB user, backup + restore drill, `/api/health` monitoring.

Automated build/lint could not be executed in the packaging environment unless dependencies are installed. Run `npm ci && npm run check` locally/CI before go-live.
