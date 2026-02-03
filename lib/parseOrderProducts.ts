export interface ParsedProduct {
  name: string;
  quantity: number;
}

/**
 * Parses the "Бараанууд" field from orders to extract individual products
 * 
 * Example input:
 * "ID: 373821 Нэр: Cappuccino SKU: 13 Сонголт: x1 ширхэг | ID: 761746 Нэр: Caffe Latte STARBUCKS® SKU: 32 Сонголт: x1 ширхэг"
 * 
 * @param rawText - The raw text from the "Бараанууд" column
 * @returns Array of parsed products with name and quantity
 */
export function parseOrderProducts(rawText: string): ParsedProduct[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const items: ParsedProduct[] = [];
  
  // Match pattern: Нэр: <product name> SKU: ... Сонголт: x<quantity>
  const regex = /Нэр:\s*([^S]+?)\s+SKU:.*?Сонголт:\s*x(\d+)/g;
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const quantity = parseInt(match[2], 10);
    
    if (name && !isNaN(quantity)) {
      items.push({ name, quantity });
    }
  }

  return items;
}
