"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

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

const PURCHASE_DRAFT_KEY =
  "hafiz_purchase_draft";

function formatMoneyForAlert(
  value: number
) {
  return Number(value).toLocaleString(
    "en-PK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function createEmptyForm(): PurchaseForm {
  return {
    date: getTodayDate(),
    supplierId: "",
    supplierBillNo: "",
    productId: "",
    quantity: "",
    bundleWeights: "",
    purchasePrice: "",
    paidAmount: "",
    paymentMethod: "Cash",
    notes: "",
  };
}

export default function PurchasesPage() {
  const [
    purchases,
    setPurchases,
  ] =
    useState<Purchase[]>([]);

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<Supplier[]>([]);

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<number | null>(
      null
    );

  /* =================================================
     SUPPLIER PAYMENT
  ================================================= */

  const [
    payingId,
    setPayingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    paymentPurchase,
    setPaymentPurchase,
  ] =
    useState<Purchase | null>(
      null
    );

  const [
    supplierPaymentAmount,
    setSupplierPaymentAmount,
  ] =
    useState("");

  const [
    supplierPaymentMethod,
    setSupplierPaymentMethod,
  ] =
    useState("Cash");

  const [
    deletingSupplier,
    setDeletingSupplier,
  ] =
    useState(false);

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    showSupplierModal,
    setShowSupplierModal,
  ] =
    useState(false);

  const [
    savingSupplier,
    setSavingSupplier,
  ] =
    useState(false);

  const [
    supplierForm,
    setSupplierForm,
  ] =
    useState<SupplierForm>({
      name: "",
      phone: "",
    });

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    form,
    setForm,
  ] =
    useState<PurchaseForm>(
      createEmptyForm()
    );

  const [
    draftReady,
    setDraftReady,
  ] =
    useState(false);

  /* =================================================
     RESTORE DRAFT
  ================================================= */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          PURCHASE_DRAFT_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(
            saved
          ) as Partial<PurchaseForm>;

        setForm({
          ...createEmptyForm(),
          ...parsed,

          date:
            String(
              parsed.date || ""
            ).trim() ||
            getTodayDate(),
        });
      }
    } catch (error) {
      console.error(
        "Restore purchase draft:",
        error
      );

      window.localStorage.removeItem(
        PURCHASE_DRAFT_KEY
      );
    } finally {
      setDraftReady(true);
    }
  }, []);

  /* =================================================
     LOAD DATA
  ================================================= */

  useEffect(() => {
    void loadAllData();
  }, []);

  /* =================================================
     SAVE DRAFT
  ================================================= */

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    if (
      editingId !== null
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        PURCHASE_DRAFT_KEY,
        JSON.stringify(form)
      );
    } catch (error) {
      console.error(
        "Save purchase draft:",
        error
      );
    }
  }, [
    form,
    editingId,
    draftReady,
  ]);

  async function loadAllData() {
    setLoading(true);

    try {
      await Promise.all([
        loadPurchases(),
        loadSuppliers(),
        loadProducts(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* =================================================
     LOAD PURCHASES
  ================================================= */

  async function loadPurchases() {
    try {
      const response =
        await fetch(
          "/api/purchases",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to load purchases."
        );
      }

      const values =
        Array.isArray(
          data.purchases
        )
          ? data.purchases
          : [];

      setPurchases(
        values
          .map(
            normalizePurchase
          )
          .filter(
            (purchase) =>
              purchase.id > 0
          )
          .sort(
            (a, b) =>
              b.id - a.id
          )
      );
    } catch (error) {
      console.error(
        "Load purchases:",
        error
      );
    }
  }

  /* =================================================
     LOAD SUPPLIERS
  ================================================= */

  async function loadSuppliers(): Promise<
    Supplier[]
  > {
    try {
      const response =
        await fetch(
          "/api/suppliers",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to load suppliers."
        );
      }

      const values =
        Array.isArray(
          data.suppliers
        )
          ? data.suppliers
          : Array.isArray(
                data.data
              )
            ? data.data
            : [];

      const cleanSuppliers =
        values
          .map(
            normalizeSupplier
          )
          .filter(
            (supplier) =>
              supplier.id > 0
          );

      setSuppliers(
        cleanSuppliers
      );

      return cleanSuppliers;
    } catch (error) {
      console.error(
        "Load suppliers:",
        error
      );

      return [];
    }
  }

  /* =================================================
     LOAD PRODUCTS
  ================================================= */

  async function loadProducts() {
    try {
      const response =
        await fetch(
          "/api/products",
          {
            cache:
              "no-store",
          }
        );

      const text =
        await response.text();

      let parsed: unknown =
        [];

      try {
        parsed =
          text
            ? JSON.parse(text)
            : [];
      } catch {
        throw new Error(
          "Products API returned invalid response."
        );
      }

      if (!response.ok) {
        const errorRecord =
          getRecord(parsed);

        throw new Error(
          getString(
            errorRecord,
            "error"
          ) ||
            getString(
              errorRecord,
              "message"
            ) ||
            "Failed to load products."
        );
      }

      let values: unknown[] =
        [];

      if (
        Array.isArray(parsed)
      ) {
        values =
          parsed;
      } else {
        const record =
          getRecord(parsed);

        if (
          Array.isArray(
            record.products
          )
        ) {
          values =
            record.products;
        }
      }

      setProducts(
        values
          .map(
            normalizeProduct
          )
          .filter(
            (product) =>
              product.id > 0
          )
      );
    } catch (error) {
      console.error(
        "Load products:",
        error
      );
    }
  }

  /* =================================================
     SELECTED SUPPLIER / PRODUCT
  ================================================= */

  const selectedSupplier =
    suppliers.find(
      (supplier) =>
        supplier.id ===
        Number(
          form.supplierId
        )
    );

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        Number(
          form.productId
        )
    );

  /* =================================================
     CALCULATIONS
  ================================================= */

  const bundleWeights =
    parseBundleWeights(
      form.bundleWeights
    );

  const totalBundleWeight =
    bundleWeights.reduce(
      (
        total,
        weight
      ) =>
        total + weight,
      0
    );

  const quantity =
    selectedProduct?.type ===
    "weight"
      ? totalBundleWeight
      : numberValue(
          form.quantity
        );

  const purchasePrice =
    numberValue(
      form.purchasePrice
    );

  const totalAmount =
    quantity *
    purchasePrice;

  const paidAmount =
    numberValue(
      form.paidAmount
    );

  const remainingAmount =
    Math.max(
      0,
      totalAmount -
        paidAmount
    );

  const currentStatus: PurchaseStatus =
    totalAmount <= 0 ||
    paidAmount <= 0
      ? "Unpaid"
      : paidAmount >=
          totalAmount
        ? "Paid"
        : "Partial";

  /* =================================================
     FILTER
  ================================================= */

  const filteredPurchases =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return purchases.filter(
        (purchase) => {
          const itemNames =
            purchase.items
              .map(
                (item) =>
                  item.productName
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !text ||
            purchase.invoiceNo
              .toLowerCase()
              .includes(
                text
              ) ||
            purchase.supplierName
              .toLowerCase()
              .includes(
                text
              ) ||
            itemNames.includes(
              text
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            purchase.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      purchases,
      search,
      statusFilter,
    ]);

  const totalPurchases =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.subtotal,
      0
    );

  const totalPaid =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.paidAmount,
      0
    );

  const totalPayable =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.remainingAmount,
      0
    );

  /* =================================================
     FORM
  ================================================= */

  function resetForm() {
    setForm(
      createEmptyForm()
    );

    setEditingId(
      null
    );
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(
        PURCHASE_DRAFT_KEY
      );

      window.localStorage.removeItem(
        "hafiz_purchase_selected_supplier"
      );
    } catch {
      // Ignore storage error.
    }
  }

  function openAddPurchase() {
    setEditingId(
      null
    );

    try {
      const saved =
        window.localStorage.getItem(
          PURCHASE_DRAFT_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(
            saved
          ) as Partial<PurchaseForm>;

        setForm({
          ...createEmptyForm(),
          ...parsed,

          date:
            String(
              parsed.date || ""
            ).trim() ||
            getTodayDate(),
        });
      } else {
        setForm(
          createEmptyForm()
        );
      }
    } catch {
      setForm(
        createEmptyForm()
      );
    }

    setShowForm(true);
  }

  function closeForm() {
    if (
      saving ||
      deletingSupplier
    ) {
      return;
    }

    setShowForm(false);

    if (
      editingId !== null
    ) {
      resetForm();
    }
  }

  function updateForm<
    K extends keyof PurchaseForm,
  >(
    field: K,
    value: PurchaseForm[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  /* =================================================
     SUPPLIER CHANGE
  ================================================= */

  function handleSupplierChange(
    value: string
  ) {
    if (
      value ===
      "ADD_NEW_SUPPLIER"
    ) {
      setSupplierForm({
        name: "",
        phone: "",
      });

      setShowSupplierModal(
        true
      );

      return;
    }

    updateForm(
      "supplierId",
      value
    );
  }

  /* =================================================
     ADD SUPPLIER
  ================================================= */

  async function handleAddSupplier(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name =
      supplierForm.name
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    const phone =
      supplierForm.phone.trim();

    if (!name) {
      alert(
        "Supplier name is required."
      );

      return;
    }

    setSavingSupplier(true);

    try {
      const response =
        await fetch(
          "/api/suppliers",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                phone,
              }),
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to add supplier."
        );

        return;
      }

      const supplierData =
        data?.supplier;

      if (!supplierData) {
        console.error(
          "Supplier missing from POST response:",
          data
        );

        alert(
          "Supplier save hua lekin API response mein supplier record nahi mila."
        );

        return;
      }

      const savedSupplier =
        normalizeSupplier(
          supplierData
        );

      if (
        !savedSupplier ||
        !Number.isFinite(
          Number(
            savedSupplier.id
          )
        ) ||
        Number(
          savedSupplier.id
        ) <= 0
      ) {
        console.error(
          "Invalid supplier returned:",
          supplierData
        );

        alert(
          "Supplier save hua lekin valid database ID nahi mili."
        );

        return;
      }

      const latestSuppliers =
        await loadSuppliers();

      const exists =
        latestSuppliers.some(
          (supplier) =>
            Number(
              supplier.id
            ) ===
            Number(
              savedSupplier.id
            )
        );

      if (!exists) {
        setSuppliers([
          savedSupplier,
          ...latestSuppliers,
        ]);
      }

      setForm(
        (previous) => ({
          ...previous,

          supplierId:
            String(
              savedSupplier.id
            ),
        })
      );

      setSupplierForm({
        name: "",
        phone: "",
      });

      setShowSupplierModal(
        false
      );
    } catch (error) {
      console.error(
        "ADD SUPPLIER ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding supplier."
      );
    } finally {
      setSavingSupplier(
        false
      );
    }
  }

  /* =================================================
     DELETE CURRENTLY SELECTED SUPPLIER
  ================================================= */

  async function handleDeleteSelectedSupplier() {
    if (!selectedSupplier) {
      alert(
        "Please select a supplier first."
      );

      return;
    }

    if (
      editingId !== null
    ) {
      alert(
        "Existing Purchase edit karte waqt supplier delete nahi kiya ja sakta. New Purchase mein supplier manage karein."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete supplier "${selectedSupplier.name}"?\n\n` +
          `Agar is supplier ki Purchase history nahi hai to permanently delete hoga.\n\n` +
          `Agar Purchase history hai to supplier active list se remove hoga, lekin old Purchase history safe rahegi.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingSupplier(
      true
    );

    try {
      const supplierId =
        selectedSupplier.id;

      const response =
        await fetch(
          `/api/suppliers/${supplierId}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to delete supplier."
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,

          supplierId:
            "",
        })
      );

      await loadSuppliers();

      try {
        const currentDraft =
          window.localStorage.getItem(
            PURCHASE_DRAFT_KEY
          );

        if (currentDraft) {
          const parsed =
            JSON.parse(
              currentDraft
            ) as Partial<PurchaseForm>;

          window.localStorage.setItem(
            PURCHASE_DRAFT_KEY,
            JSON.stringify({
              ...parsed,

              supplierId:
                "",
            })
          );
        }

        window.localStorage.removeItem(
          "hafiz_purchase_selected_supplier"
        );
      } catch {
        // Ignore localStorage errors.
      }

      const mode =
        getString(
          data,
          "mode"
        );

      if (
        mode ===
        "deactivated"
      ) {
        alert(
          "Supplier removed successfully. Old Purchase history safe rakhi gayi hai."
        );
      } else {
        alert(
          "Supplier deleted successfully."
        );
      }
    } catch (error) {
      console.error(
        "Delete supplier:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting supplier."
      );
    } finally {
      setDeletingSupplier(
        false
      );
    }
  }

  /* =================================================
     PRODUCT CHANGE
  ================================================= */

  function handleProductChange(
    value: string
  ) {
    const product =
      products.find(
        (item) =>
          item.id ===
          Number(value)
      );

    setForm(
      (previous) => ({
        ...previous,

        productId:
          value,

        quantity:
          "",

        bundleWeights:
          "",

        purchasePrice:
          product &&
          product.purchasePrice >
            0
            ? String(
                product.purchasePrice
              )
            : "",
      })
    );
  }

  /* =================================================
     SAVE PURCHASE
  ================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.supplierId
    ) {
      return alert(
        "Please select a supplier."
      );
    }

    let currentSupplier =
      suppliers.find(
        (supplier) =>
          supplier.id ===
          Number(
            form.supplierId
          )
      );

    if (!currentSupplier) {
      const latestSuppliers =
        await loadSuppliers();

      currentSupplier =
        latestSuppliers.find(
          (supplier) =>
            supplier.id ===
            Number(
              form.supplierId
            )
        );
    }

    if (!currentSupplier) {
      updateForm(
        "supplierId",
        ""
      );

      return alert(
        "Selected supplier was not found. Please select supplier again."
      );
    }

    if (
      !form.productId
    ) {
      return alert(
        "Please select a product."
      );
    }

    if (!selectedProduct) {
      return alert(
        "Selected product was not found."
      );
    }

    if (
      selectedProduct.type ===
      "weight"
    ) {
      if (
        bundleWeights.length ===
        0
      ) {
        return alert(
          "Please enter bundle weights."
        );
      }

      if (
        totalBundleWeight <=
        0
      ) {
        return alert(
          "Total weight must be greater than 0."
        );
      }
    } else {
      if (
        quantity <= 0
      ) {
        return alert(
          "Quantity must be greater than 0."
        );
      }

      if (
        !Number.isInteger(
          quantity
        )
      ) {
        return alert(
          "PCS quantity must be a whole number."
        );
      }
    }

    if (
      purchasePrice <= 0
    ) {
      return alert(
        "Purchase price must be greater than 0."
      );
    }

    if (
      paidAmount < 0
    ) {
      return alert(
        "Paid amount cannot be negative."
      );
    }

    if (
      paidAmount >
      totalAmount
    ) {
      return alert(
        "Paid amount cannot be greater than purchase total."
      );
    }

    const weightEntries =
      selectedProduct.type ===
      "weight"
        ? bundleWeights.join(
            "+"
          )
        : "";

    const requestBody = {
      supplierId:
        currentSupplier.id,

      supplierName:
        currentSupplier.name,

      supplierPhone:
        currentSupplier.phone,

      supplierBillNo:
        form.supplierBillNo.trim(),

      date:
        form.date,

      purchaseDate:
        form.date,

      items: [
        {
          productId:
            selectedProduct.id,

          quantity,

          purchasePrice,

          weightEntries,
        },
      ],

      paidAmount,

      paymentMethod:
        form.paymentMethod,

      notes:
        form.notes.trim(),
    };

    setSaving(true);

    try {
      const isEditing =
        editingId !==
        null;

      const url =
        isEditing
          ? `/api/purchases/${editingId}`
          : "/api/purchases";

      const method =
        isEditing
          ? "PUT"
          : "POST";

      const response =
        await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to save purchase."
        );

        return;
      }

      await Promise.all([
        loadPurchases(),
        loadProducts(),
        loadSuppliers(),
      ]);

      if (!isEditing) {
        clearDraft();
      }

      setShowForm(false);

      resetForm();

      alert(
        isEditing
          ? "Purchase updated successfully."
          : "Purchase saved successfully."
      );
    } catch (error) {
      console.error(
        "Save purchase:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving purchase."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =================================================
     EDIT PURCHASE
  ================================================= */

  function editPurchase(
    purchase: Purchase
  ) {
    const item =
      purchase.items[0];

    if (!item) {
      return alert(
        "Purchase item not found."
      );
    }

    const product =
      products.find(
        (productItem) =>
          productItem.id ===
          item.productId
      );

    const isWeight =
      product?.type ===
        "weight" ||
      item.unit ===
        "KG";

    setForm({
      date:
        purchase.date ||
        getTodayDate(),

      supplierId:
        String(
          purchase.supplierId
        ),

      supplierBillNo:
        purchase.supplierBillNo ||
        "",

      productId:
        String(
          item.productId
        ),

      quantity:
        isWeight
          ? ""
          : String(
              item.quantity
            ),

      bundleWeights:
        isWeight
          ? item.weightEntries &&
            item.weightEntries.trim()
            ? item.weightEntries
            : String(
                item.quantity
              )
          : "",

      purchasePrice:
        String(
          item.purchasePrice
        ),

      paidAmount:
        String(
          purchase.paidAmount
        ),

      paymentMethod:
        purchase.paymentMethod,

      notes:
        purchase.notes,
    });

    setEditingId(
      purchase.id
    );

    setShowForm(true);
  }

  /* =================================================
     OPEN PAY SUPPLIER
  ================================================= */

  function openPaySupplier(
    purchase: Purchase
  ) {
    if (
      purchase.remainingAmount <= 0
    ) {
      alert(
        "This purchase is already fully paid."
      );

      return;
    }

    setPaymentPurchase(
      purchase
    );

    setSupplierPaymentAmount(
      ""
    );

    setSupplierPaymentMethod(
      purchase.paymentMethod ||
        "Cash"
    );
  }

  /* =================================================
     CLOSE PAY SUPPLIER
  ================================================= */

  function closePaySupplier() {
    if (
      payingId !== null
    ) {
      return;
    }

    setPaymentPurchase(
      null
    );

    setSupplierPaymentAmount(
      ""
    );

    setSupplierPaymentMethod(
      "Cash"
    );
  }

  /* =================================================
     PAY FULL SUPPLIER BALANCE
  ================================================= */

  function fillFullSupplierPayment() {
    if (
      !paymentPurchase
    ) {
      return;
    }

    setSupplierPaymentAmount(
      String(
        paymentPurchase.remainingAmount
      )
    );
  }

  /* =================================================
     SAVE SUPPLIER PAYMENT
  ================================================= */

  async function handleSupplierPayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !paymentPurchase
    ) {
      return;
    }

    const amount =
      numberValue(
        supplierPaymentAmount
      );

    if (
      amount <= 0
    ) {
      alert(
        "Payment amount must be greater than 0."
      );

      return;
    }

    if (
      amount >
      paymentPurchase.remainingAmount
    ) {
      alert(
        `Payment cannot be greater than remaining payable ${formatMoneyForAlert(
          paymentPurchase.remainingAmount
        )}.`
      );

      return;
    }

    setPayingId(
      paymentPurchase.id
    );

    try {
      const response =
        await fetch(
          `/api/purchases/${paymentPurchase.id}/payments`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                amount,

                paymentMethod:
                  supplierPaymentMethod,
              }),
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to record supplier payment."
        );

        return;
      }

      await loadPurchases();

      setPaymentPurchase(
        null
      );

      setSupplierPaymentAmount(
        ""
      );

      setSupplierPaymentMethod(
        "Cash"
      );

      alert(
        getString(
          data,
          "message"
        ) ||
          "Supplier payment recorded successfully."
      );
    } catch (error) {
      console.error(
        "Pay supplier:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while recording supplier payment."
      );
    } finally {
      setPayingId(
        null
      );
    }
  }

  /* =================================================
     DELETE PURCHASE
  ================================================= */

  async function deletePurchase(
    purchase: Purchase
  ) {
    const confirmed =
      window.confirm(
        `Delete ${purchase.invoiceNo}?\n\nStock added by this purchase will also be reversed.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      purchase.id
    );

    try {
      const response =
        await fetch(
          `/api/purchases/${purchase.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to delete purchase."
        );

        return;
      }

      await Promise.all([
        loadPurchases(),
        loadProducts(),
        loadSuppliers(),
      ]);

      alert(
        "Purchase deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete purchase:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting purchase."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =================================================
     UI
  ================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Purchases
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record supplier purchases, payments and stock receiving.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openAddPurchase
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        <PurchaseStats
          totalPurchases={
            totalPurchases
          }
          totalPaid={
            totalPaid
          }
          totalPayable={
            totalPayable
          }
          entries={
            purchases.length
          }
        />

        <PurchaseFilters
          search={
            search
          }
          setSearch={
            setSearch
          }
          statusFilter={
            statusFilter
          }
          setStatusFilter={
            setStatusFilter
          }
        />

        <PurchaseTable
          purchases={
            filteredPurchases
          }
          loading={
            loading
          }
          deletingId={
            deletingId
          }
          payingId={
            payingId
          }
          onPaySupplier={
            openPaySupplier
          }
          onEdit={
            editPurchase
          }
          onDelete={(purchase) =>
            void deletePurchase(
              purchase
            )
          }
        />
      </div>

      <PurchaseModal
        open={
          showForm
        }
        editingId={
          editingId
        }
        saving={
          saving
        }
        deletingSupplier={
          deletingSupplier
        }
        form={
          form
        }
        suppliers={
          suppliers
        }
        products={
          products
        }
        selectedSupplier={
          selectedSupplier
        }
        selectedProduct={
          selectedProduct
        }
        bundleWeights={
          bundleWeights
        }
        totalBundleWeight={
          totalBundleWeight
        }
        quantity={
          quantity
        }
        purchasePrice={
          purchasePrice
        }
        totalAmount={
          totalAmount
        }
        paidAmount={
          paidAmount
        }
        remainingAmount={
          remainingAmount
        }
        currentStatus={
          currentStatus
        }
        onClose={
          closeForm
        }
        onSubmit={
          handleSubmit
        }
        updateForm={
          updateForm
        }
        onSupplierChange={
          handleSupplierChange
        }
        onDeleteSupplier={() =>
          void handleDeleteSelectedSupplier()
        }
        onProductChange={
          handleProductChange
        }
      />

      {/* =================================================
          PAY SUPPLIER MODAL
      ================================================= */}

      {paymentPurchase && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Pay Supplier
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      paymentPurchase.supplierName
                    }
                    {" • "}
                    {
                      paymentPurchase.invoiceNo
                    }
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    payingId !== null
                  }
                  onClick={
                    closePaySupplier
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-b border-slate-200 bg-slate-50 p-5">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-medium text-slate-500">
                  Purchase
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {formatMoneyForAlert(
                    paymentPurchase.subtotal
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-medium text-slate-500">
                  Paid
                </p>

                <p className="mt-1 font-bold text-emerald-600">
                  {formatMoneyForAlert(
                    paymentPurchase.paidAmount
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-medium text-slate-500">
                  Payable
                </p>

                <p className="mt-1 font-bold text-red-600">
                  {formatMoneyForAlert(
                    paymentPurchase.remainingAmount
                  )}
                </p>
              </div>
            </div>

            <form
              onSubmit={
                handleSupplierPayment
              }
              className="space-y-5 p-6"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Payment Amount
                  </label>

                  <button
                    type="button"
                    onClick={
                      fillFullSupplierPayment
                    }
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Pay Full
                  </button>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={
                    supplierPaymentAmount
                  }
                  onChange={(event) =>
                    setSupplierPaymentAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <select
                  value={
                    supplierPaymentMethod
                  }
                  onChange={(event) =>
                    setSupplierPaymentMethod(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                >
                  <option value="Cash">
                    Cash
                  </option>

                  <option value="Bank">
                    Bank
                  </option>

                  <option value="Credit">
                    Credit
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {numberValue(
                supplierPaymentAmount
              ) > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    After Payment
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Remaining Payable
                    </span>

                    <span className="font-bold text-slate-900">
                      {formatMoneyForAlert(
                        Math.max(
                          0,
                          paymentPurchase.remainingAmount -
                            numberValue(
                              supplierPaymentAmount
                            )
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    payingId !== null
                  }
                  onClick={
                    closePaySupplier
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    payingId !== null
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payingId !== null
                    ? "Recording Payment..."
                    : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SupplierModal
        open={
          showSupplierModal
        }
        form={
          supplierForm
        }
        setForm={
          setSupplierForm
        }
        saving={
          savingSupplier
        }
        onClose={() =>
          setShowSupplierModal(
            false
          )
        }
        onSubmit={
          handleAddSupplier
        }
      />
    </div>
  );
}