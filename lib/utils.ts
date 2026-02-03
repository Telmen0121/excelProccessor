/**
 * Safely parse a float from various input types
 */
export function parseFloatSafe(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    // Remove commas and whitespace
    const cleaned = value.replace(/,/g, '').replace(/\s/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Safely parse an integer from various input types
 */
export function parseIntSafe(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Safely parse a date from various input types
 */
export function parseDateSafe(value: unknown): Date {
  if (!value) {
    return new Date();
  }
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date() : value;
  }
  
  if (typeof value === 'number') {
    // Excel serial date number
    const date = excelSerialToDate(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  return new Date();
}

/**
 * Convert Excel serial date number to JavaScript Date
 */
function excelSerialToDate(serial: number): Date {
  // Excel's epoch is January 1, 1900
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

/**
 * Get string value or null
 */
export function getStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).trim() || null;
}
