/**
 * Detects the type of Excel file based on column headers
 * @param headers - Array of column header names
 * @returns "orders" | "products" | "unknown"
 */
export function detectFileType(headers: string[]): "orders" | "products" | "unknown" {
  // Type A - Orders: has "Код" and "Бараанууд" columns
  if (headers.includes("Код") && headers.includes("Бараанууд")) {
    return "orders";
  }
  
  // Type B - Products: has "Нэр" and "Ангилалууд" columns
  if (headers.includes("Нэр") && headers.includes("Ангилалууд")) {
    return "products";
  }
  
  return "unknown";
}
