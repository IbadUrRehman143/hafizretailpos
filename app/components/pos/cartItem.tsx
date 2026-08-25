"use client";

type CartItemType = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  icon: string;
  quantity: number;
};

type CartItemProps = {
  item: CartItemType;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
};

export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">

      <div className="flex gap-3">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
          {item.icon}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex justify-between gap-2">

            <div>
              <h4 className="truncate text-sm font-bold text-slate-900">
                {item.name}
              </h4>

              <p className="text-xs text-slate-500">
                Rs. {item.price.toLocaleString("en-PK")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="h-7 w-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              ×
            </button>

          </div>

          <div className="mt-3 flex items-center justify-between">

            <div className="flex items-center rounded-lg border border-slate-200">

              <button
                type="button"
                onClick={() => onDecrease(item.id)}
                className="h-8 w-8 font-bold hover:bg-slate-100"
              >
                −
              </button>

              <span className="flex h-8 min-w-8 items-center justify-center border-x border-slate-200 text-sm font-bold">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => onIncrease(item.id)}
                disabled={item.quantity >= item.stock}
                className="h-8 w-8 font-bold hover:bg-slate-100 disabled:text-slate-300"
              >
                +
              </button>

            </div>

            <span className="text-sm font-bold">
              Rs.{" "}
              {(item.price * item.quantity).toLocaleString("en-PK")}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}