import {
  Search,
} from "lucide-react";

/* =====================================================
   PROPS
===================================================== */

type InventoryFiltersProps = {
  search: string;

  setSearch: (
    value: string
  ) => void;

  categoryFilter: string;

  setCategoryFilter: (
    value: string
  ) => void;

  statusFilter: string;

  setStatusFilter: (
    value: string
  ) => void;

  categories: string[];
};

/* =====================================================
   INVENTORY FILTERS
===================================================== */

export default function InventoryFilters({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  categories,
}: InventoryFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search product, SKU or category..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* =================================================
            CATEGORY
        ================================================= */}

        <select
          value={
            categoryFilter
          }
          onChange={(
            event
          ) =>
            setCategoryFilter(
              event.target.value
            )
          }
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
        >
          {categories.map(
            (category) => (
              <option
                key={
                  category
                }
                value={
                  category
                }
              >
                {category ===
                "All"
                  ? "All Categories"
                  : category}
              </option>
            )
          )}
        </select>

        {/* =================================================
            STATUS
        ================================================= */}

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
        >
          <option value="All">
            All Status
          </option>

          <option value="In Stock">
            In Stock
          </option>

          <option value="Low Stock">
            Low Stock
          </option>

          <option value="Out of Stock">
            Out of Stock
          </option>
        </select>

      </div>
    </div>
  );
}