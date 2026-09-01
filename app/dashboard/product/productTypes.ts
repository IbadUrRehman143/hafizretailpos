export type ProductType =
  | "quantity"
  | "weight"
  | "size";

export type ProductStatus =
  | "Active"
  | "Archived";

export type CategoryStatus =
  | "Active"
  | "Inactive";

// ======================================================
// SUBCATEGORY
// ======================================================

export type Subcategory = {
  id: number;

  categoryId: number;

  categoryName?: string;

  name: string;

  description: string;

  status: CategoryStatus;
};

// ======================================================
// CATEGORY
// ======================================================

export type Category = {
  id: number;

  name: string;

  description: string;

  status: CategoryStatus;

  subcategories?: Subcategory[];
};

// ======================================================
// PRODUCT
// ======================================================

export type Product = {
  id: number;

  name: string;

  categoryId: number | null;

  categoryName: string;

  subcategoryId: number | null;

  subcategoryName: string;

  status: ProductStatus;

  type: ProductType;

  unit: string;

  purchasePrice: number;

  sellingPrice: number;

  quantity: number;

  weightEntries: string;

  size: string;

  material: string;

  brand: string;

  model: string;

  quality: string;

  color: string;
};

// ======================================================
// EMPTY PRODUCT
// ======================================================

export function createEmptyProduct(): Product {
  return {
    id: 0,

    name: "",

    categoryId: null,

    categoryName: "",

    subcategoryId: null,

    subcategoryName: "",

    status: "Active",

    type: "quantity",

    unit: "PCS",

    purchasePrice: 0,

    sellingPrice: 0,

    quantity: 0,

    weightEntries: "",

    size: "",

    material: "",

    brand: "",

    model: "",

    quality: "",

    color: "",
  };
}