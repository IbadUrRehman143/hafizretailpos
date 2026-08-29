export type ProductType =
  | "quantity"
  | "weight"
  | "size";

export type Product = {
  id: number;
  name: string;
  category: string;
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

export const categories = [
  "Cotton",
  "Electronics",
  "Beds",
  "Furniture",
  "Appliances",
  "Bamboo",
  "Other",
];

export function createEmptyProduct(): Product {
  return {
    id: 0,
    name: "",
    category: "Electronics",
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