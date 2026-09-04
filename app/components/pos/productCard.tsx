"use client";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  icon: string;

  barcode: string;

  type:
    | "quantity"
    | "weight"
    | "size";

  unit: string;
};

type ProductCardProps = {
  product: Product;

  onAdd: (
    product: Product
  ) => void;
};

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* PRODUCT IMAGE / ICON */}

      <div className="flex h-24 items-center justify-center bg-slate-50 sm:h-28 lg:h-32">

        <div className="text-4xl sm:text-5xl">
          {product.icon}
        </div>

      </div>

      {/* PRODUCT INFO */}

      <div className="flex flex-1 flex-col p-3 sm:p-4">

        <p className="truncate text-xs font-medium text-blue-600">
          {product.category}
        </p>

        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
          {product.name}
        </h3>

        {product.barcode && (
          <p className="mt-1 truncate text-[11px] text-slate-400">
            Barcode: {product.barcode}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">

          <span className="break-words text-base font-bold text-slate-900 sm:text-lg">
            Rs.{" "}
            {product.price.toLocaleString(
              "en-PK"
            )}
          </span>

          <span className="text-xs text-slate-500">
            Stock:{" "}
            {product.stock.toLocaleString(
              "en-PK",
              {
                maximumFractionDigits:
                  2,
              }
            )}{" "}
            {product.unit}
          </span>

        </div>

        <button
          type="button"
          onClick={() =>
            onAdd(product)
          }
          disabled={
            product.stock <= 0
          }
          className="mt-auto min-h-11 w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-4 sm:px-4 sm:py-3"
        >
          {product.stock > 0
            ? "Add to Cart"
            : "Out of Stock"}
        </button>

      </div>

    </div>
  );
}