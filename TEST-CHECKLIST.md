# Final runtime test
After installer/build passes, run `npm start` and test:

1. Open `/dashboard/ai-command-center`.
2. AI Knowledge Hub: add Supplier Terms with `Supplier gives 15 days credit.` Search `15 days credit`.
3. Enter a valid Supplier ID and click `Build 30-Day Purchase Plan`.
4. AI Approval Center: PENDING → APPROVE → EXECUTE.
5. Open Purchases and verify a real `PUR-xxxx` row was created only after approval.
6. Verify stock and InventoryTransaction changed once, not before approval.
7. Create a completed return on a paid/partial invoice and verify invoice total/due is reduced and refund payment history contains a negative REFUND entry.
8. Sign in with a limited role and verify forbidden routes return 403.
9. Sign in with a branch user and verify sales/purchases/returns from another branch are not returned.
10. Restart the server and verify Knowledge Hub and Approval history still exist.
