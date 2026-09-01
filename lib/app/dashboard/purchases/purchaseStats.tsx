import { StatCard } from "./purchaseUi";
import { formatCurrency } from "./purchaseUtils";

export default function PurchaseStats({
  totalPurchases,
  totalPaid,
  totalPayable,
  entries,
}: {
  totalPurchases: number;
  totalPaid: number;
  totalPayable: number;
  entries: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard title="Purchase Value" value={formatCurrency(totalPurchases)} />
      <StatCard title="Total Paid" value={formatCurrency(totalPaid)} />
      <StatCard title="Payable" value={formatCurrency(totalPayable)} />
      <StatCard title="Purchase Entries" value={String(entries)} />
    </div>
  );
}
