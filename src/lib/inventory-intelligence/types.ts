export type StockRisk = "SAFE" | "WATCH" | "HIGH_RISK" | "OUT_OF_STOCK";

export type InventoryIntelligenceItem = {
  productId: number;
  productName: string;
  productType: string;
  unit: string;
  currentStock: number;
  sold7Days: number;
  sold30Days: number;
  avgDaily7Days: number;
  avgDaily30Days: number;
  weightedDailyVelocity: number;
  daysRemaining: number | null;
  risk: StockRisk;
  riskReason: string;
  reorderRequired: boolean;
  targetStockDays: number;
  reorderPoint: number;
  recommendedReorder: number;
  purchasePrice: number;
  estimatedPurchaseCost: number;
};

export type InventoryIntelligenceSummary = {
  generatedAt: string;
  windowDays: 30;
  targetStockDays: number;
  products: number;
  safe: number;
  watch: number;
  highRisk: number;
  outOfStock: number;
  reorderProducts: number;
  estimatedPurchaseCost: number;
  items: InventoryIntelligenceItem[];
};
