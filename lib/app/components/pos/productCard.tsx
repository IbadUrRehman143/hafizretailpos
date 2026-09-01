"use client";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  icon: string;
};

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      
      <div className="flex h-32 items-center justify-center bg-slate-50">
        <div className="text-5xl">
          {product.icon}
        </div>
      </div>

      <div className="p-4">

        <p className="text-xs font-medium text-blue-600">
          {product.category}
        </p>

        <h3 className="mt-1 text-base font-bold text-slate-900">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            Rs. {product.price.toLocaleString("en-PK")}
          </span>

          <span className="text-xs text-slate-500">
            Stock: {product.stock}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={product.stock <= 0}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
        >
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>

      </div>
    </div>
  );
}