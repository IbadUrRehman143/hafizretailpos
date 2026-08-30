import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

type InventoryStatsProps = {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

/* =====================================================
   INVENTORY STATS
===================================================== */

export default function InventoryStats({
  totalItems,
  inStock,
  lowStock,
  outOfStock,
}: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="Total Items"
        value={totalItems}
        icon={
          <Boxes size={20} />
        }
        iconClass="bg-blue-50 text-blue-600"
      />

      <StatCard
        title="In Stock"
        value={inStock}
        icon={
          <CheckCircle2
            size={20}
          />
        }
        iconClass="bg-emerald-50 text-emerald-600"
      />

      <StatCard
        title="Low Stock"
        value={lowStock}
        icon={
          <AlertTriangle
            size={20}
          />
        }
        iconClass="bg-amber-50 text-amber-600"
      />

      <StatCard
        title="Out of Stock"
        value={outOfStock}
        icon={
          <XCircle
            size={20}
          />
        }
        iconClass="bg-red-50 text-red-600"
      />
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}