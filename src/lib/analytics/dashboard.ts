import { getTopCustomers } from "./customers";
import { getInventoryValue, getLowStockProducts, getOutOfStockProducts } from "./inventory";
import { getSlowMovingProducts, getTodaySales, getTopSellingProducts } from "./sales";

export async function getDashboardAnalytics() {
  const [
    todaySales,
    topSellingProducts,
    slowMovingProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryValue,
    topCustomers,
  ] = await Promise.all([
    getTodaySales(),
    getTopSellingProducts(5),
    getSlowMovingProducts(5),
    getLowStockProducts(),
    getOutOfStockProducts(),
    getInventoryValue(),
    getTopCustomers(5),
  ]);

  return {
    todaySales,
    topSellingProducts,
    slowMovingProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryValue,
    topCustomers,
  };
}
