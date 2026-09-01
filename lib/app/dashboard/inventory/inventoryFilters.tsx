"use client";

export default function InventoryFilters({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  categories,
}: {
  search: string;
  setSearch: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categories: string[];
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search product, SKU or category..."
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />

      <select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === "All" ? "All Categories" : category}
          </option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
      >
        <option value="All">All Stock</option>
        <option value="In Stock">In Stock</option>
        <option value="Low Stock">Low Stock</option>
        <option value="Out of Stock">Out of Stock</option>
      </select>
    </div>
  );
}
