"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import PurchaseFilters from "./purchaseFilters";
import PurchaseModal from "./purchaseModal";
import PurchaseStats from "./purchaseStats";
import PurchaseTable from "./purchaseTable";
import SupplierModal from "./supplierModal";
import type {
  Product,
  Purchase,
  PurchaseForm,
  PurchaseStatus,
  Supplier,
  SupplierForm,
} from "./purchaseTypes";
import {
  getRecord,
  getString,
  getTodayDate,
  normalizeProduct,
  normalizePurchase,
  normalizeSupplier,
  numberValue,
  parseBundleWeights,
  readApiResponse,
} from "./purchaseUtils";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: "",
    phone: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState<PurchaseForm>({
    date: getTodayDate(),
    supplierId: "",
    productId: "",
    quantity: "",
    bundleWeights: "",
    purchasePrice: "",
    paidAmount: "",
    paymentMethod: "Cash",
    notes: "",
  });

  useEffect(() => {
    void loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      await Promise.all([loadPurchases(), loadSuppliers(), loadProducts()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPurchases() {
    try {
      const response = await fetch("/api/purchases", { cache: "no-store" });
      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(
          getString(data, "error") ||
            getString(data, "message") ||
            "Failed to load purchases."
        );
      }

      const values = Array.isArray(data.purchases) ? data.purchases : [];
      setPurchases(
        values
          .map(normalizePurchase)
          .filter((purchase) => purchase.id > 0)
          .sort((a, b) => b.id - a.id)
      );
    } catch (error) {
      console.error("Load purchases:", error);
    }
  }

  async function loadSuppliers() {
    try {
      const response = await fetch("/api/suppliers", { cache: "no-store" });
      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(
          getString(data, "error") ||
            getString(data, "message") ||
            "Failed to load suppliers."
        );
      }

      const values = Array.isArray(data.suppliers) ? data.suppliers : [];
      setSuppliers(values.map(normalizeSupplier).filter((supplier) => supplier.id > 0));
    } catch (error) {
      console.error("Load suppliers:", error);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const text = await response.text();
      let parsed: unknown = [];

      try {
        parsed = text ? JSON.parse(text) : [];
      } catch {
        throw new Error("Products API returned invalid response.");
      }

      if (!response.ok) {
        const errorRecord = getRecord(parsed);
        throw new Error(
          getString(errorRecord, "error") ||
            getString(errorRecord, "message") ||
            "Failed to load products."
        );
      }

      let values: unknown[] = [];
      if (Array.isArray(parsed)) {
        values = parsed;
      } else {
        const record = getRecord(parsed);
        if (Array.isArray(record.products)) values = record.products;
      }

      setProducts(values.map(normalizeProduct).filter((product) => product.id > 0));
    } catch (error) {
      console.error("Load products:", error);
    }
  }

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === Number(form.supplierId)
  );

  const selectedProduct = products.find(
    (product) => product.id === Number(form.productId)
  );

  const bundleWeights = parseBundleWeights(form.bundleWeights);
  const totalBundleWeight = bundleWeights.reduce((total, weight) => total + weight, 0);
  const quantity =
    selectedProduct?.type === "weight"
      ? totalBundleWeight
      : numberValue(form.quantity);
  const purchasePrice = numberValue(form.purchasePrice);
  const totalAmount = quantity * purchasePrice;
  const paidAmount = numberValue(form.paidAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const currentStatus: PurchaseStatus =
    totalAmount <= 0 || paidAmount <= 0
      ? "Unpaid"
      : paidAmount >= totalAmount
        ? "Paid"
        : "Partial";

  const filteredPurchases = useMemo(() => {
    const text = search.trim().toLowerCase();
    return purchases.filter((purchase) => {
      const itemNames = purchase.items
        .map((item) => item.productName)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !text ||
        purchase.invoiceNo.toLowerCase().includes(text) ||
        purchase.supplierName.toLowerCase().includes(text) ||
        itemNames.includes(text);

      const matchesStatus =
        statusFilter === "All" || purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const totalPurchases = purchases.reduce(
    (total, purchase) => total + purchase.subtotal,
    0
  );
  const totalPaid = purchases.reduce(
    (total, purchase) => total + purchase.paidAmount,
    0
  );
  const totalPayable = purchases.reduce(
    (total, purchase) => total + purchase.remainingAmount,
    0
  );

  function resetForm() {
    setForm({
      date: getTodayDate(),
      supplierId: "",
      productId: "",
      quantity: "",
      bundleWeights: "",
      purchasePrice: "",
      paidAmount: "",
      paymentMethod: "Cash",
      notes: "",
    });
    setEditingId(null);
  }

  function openAddPurchase() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    resetForm();
  }

  function updateForm<K extends keyof PurchaseForm>(
    field: K,
    value: PurchaseForm[K]
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleSupplierChange(value: string) {
    if (value === "ADD_NEW_SUPPLIER") {
      setSupplierForm({ name: "", phone: "" });
      setShowSupplierModal(true);
      return;
    }
    updateForm("supplierId", value);
  }

  function handleProductChange(value: string) {
    const product = products.find((item) => item.id === Number(value));
    setForm((previous) => ({
      ...previous,
      productId: value,
      quantity: "",
      bundleWeights: "",
      purchasePrice:
        product && product.purchasePrice > 0 ? String(product.purchasePrice) : "",
    }));
  }

  async function handleAddSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = supplierForm.name.trim();
    const phone = supplierForm.phone.trim();

    if (!name) {
      alert("Supplier name is required.");
      return;
    }

    setSavingSupplier(true);
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        alert(
          getString(data, "error") ||
            getString(data, "message") ||
            "Failed to add supplier."
        );
        return;
      }

      const newSupplier = normalizeSupplier(data.supplier);
      if (newSupplier.id <= 0) {
        alert("Supplier saved but valid ID was not returned.");
        await loadSuppliers();
        return;
      }

      setSuppliers((previous) =>
        previous.some((supplier) => supplier.id === newSupplier.id)
          ? previous
          : [...previous, newSupplier]
      );
      setForm((previous) => ({
        ...previous,
        supplierId: String(newSupplier.id),
      }));
      setSupplierForm({ name: "", phone: "" });
      setShowSupplierModal(false);
    } catch (error) {
      console.error("Add supplier:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while adding supplier.");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.supplierId) return alert("Please select a supplier.");
    if (!selectedSupplier) return alert("Selected supplier was not found.");
    if (!form.productId) return alert("Please select a product.");
    if (!selectedProduct) return alert("Selected product was not found.");

    if (selectedProduct.type === "weight") {
      if (bundleWeights.length === 0) return alert("Please enter bundle weights.");
      if (totalBundleWeight <= 0) return alert("Total weight must be greater than 0.");
    } else {
      if (quantity <= 0) return alert("Quantity must be greater than 0.");
      if (!Number.isInteger(quantity)) return alert("PCS quantity must be a whole number.");
    }

    if (purchasePrice <= 0) return alert("Purchase price must be greater than 0.");
    if (paidAmount < 0) return alert("Paid amount cannot be negative.");
    if (paidAmount > totalAmount) return alert("Paid amount cannot be greater than purchase total.");

    const weightEntries =
      selectedProduct.type === "weight" ? bundleWeights.join("+") : "";

    const requestBody = {
      supplierId: Number(form.supplierId),
      supplierName: selectedSupplier.name,
      supplierPhone: selectedSupplier.phone,
      date: form.date,
      purchaseDate: form.date,
      items: [
        {
          productId: selectedProduct.id,
          quantity,
          purchasePrice,
          weightEntries,
        },
      ],
      paidAmount,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `/api/purchases/${editingId}` : "/api/purchases";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        alert(
          getString(data, "error") ||
            getString(data, "message") ||
            "Failed to save purchase."
        );
        return;
      }

      await Promise.all([loadPurchases(), loadProducts(), loadSuppliers()]);
      setShowForm(false);
      resetForm();
      alert(isEditing ? "Purchase updated successfully." : "Purchase saved successfully.");
    } catch (error) {
      console.error("Save purchase:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while saving purchase.");
    } finally {
      setSaving(false);
    }
  }

  function editPurchase(purchase: Purchase) {
    const item = purchase.items[0];
    if (!item) return alert("Purchase item not found.");

    const product = products.find((productItem) => productItem.id === item.productId);
    const isWeight = product?.type === "weight" || item.unit === "KG";

    setForm({
      date: purchase.date || getTodayDate(),
      supplierId: String(purchase.supplierId),
      productId: String(item.productId),
      quantity: isWeight ? "" : String(item.quantity),
      bundleWeights: isWeight
        ? item.weightEntries && item.weightEntries.trim()
          ? item.weightEntries
          : String(item.quantity)
        : "",
      purchasePrice: String(item.purchasePrice),
      paidAmount: String(purchase.paidAmount),
      paymentMethod: purchase.paymentMethod,
      notes: purchase.notes,
    });
    setEditingId(purchase.id);
    setShowForm(true);
  }

  async function deletePurchase(purchase: Purchase) {
    const confirmed = window.confirm(
      `Delete ${purchase.invoiceNo}?\n\nStock added by this purchase will also be reversed.`
    );
    if (!confirmed) return;

    setDeletingId(purchase.id);
    try {
      const response = await fetch(`/api/purchases/${purchase.id}`, {
        method: "DELETE",
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        alert(
          getString(data, "error") ||
            getString(data, "message") ||
            "Failed to delete purchase."
        );
        return;
      }

      await Promise.all([loadPurchases(), loadProducts(), loadSuppliers()]);
      alert("Purchase deleted successfully.");
    } catch (error) {
      console.error("Delete purchase:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while deleting purchase.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
            <p className="mt-1 text-sm text-slate-500">
              Record supplier purchases, payments and stock receiving.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddPurchase}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        <PurchaseStats
          totalPurchases={totalPurchases}
          totalPaid={totalPaid}
          totalPayable={totalPayable}
          entries={purchases.length}
        />

        <PurchaseFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <PurchaseTable
          purchases={filteredPurchases}
          loading={loading}
          deletingId={deletingId}
          onEdit={editPurchase}
          onDelete={(purchase) => void deletePurchase(purchase)}
        />
      </div>

      <PurchaseModal
        open={showForm}
        editingId={editingId}
        saving={saving}
        form={form}
        suppliers={suppliers}
        products={products}
        selectedSupplier={selectedSupplier}
        selectedProduct={selectedProduct}
        bundleWeights={bundleWeights}
        totalBundleWeight={totalBundleWeight}
        quantity={quantity}
        purchasePrice={purchasePrice}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        remainingAmount={remainingAmount}
        currentStatus={currentStatus}
        onClose={closeForm}
        onSubmit={handleSubmit}
        updateForm={updateForm}
        onSupplierChange={handleSupplierChange}
        onProductChange={handleProductChange}
      />

      <SupplierModal
        open={showSupplierModal}
        form={supplierForm}
        setForm={setSupplierForm}
        saving={savingSupplier}
        onClose={() => setShowSupplierModal(false)}
        onSubmit={handleAddSupplier}
      />
    </div>
  );
}
