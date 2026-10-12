/**
 * Currency utilities for FINOVA
 * All monetary calculations use integer paise (1 Rupee = 100 paise)
 * to eliminate floating-point drift and rounding errors.
 */

/**
 * Parses user input into integer paise strictly.
 * Accepts positive numbers or decimal strings (e.g., "1500", "1500.50", 1500).
 * Rejects 0, negatives, NaN, Infinity, and malformed strings.
 *
 * @param {string|number} input 
 * @returns {number|null} Integer paise, or null if invalid
 */
export function parseRupeesToPaise(input) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  // If input is number
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) {
      return null;
    }
    // Convert to 2-decimal string to avoid floating point multiplication issues
    const formatted = input.toFixed(2);
    const parts = formatted.split('.');
    const rupees = parseInt(parts[0], 10);
    const paise = parseInt(parts[1], 10);
    return rupees * 100 + paise;
  }

  // If input is string
  if (typeof input === 'string') {
    const clean = input.trim();
    // Validate format: e.g., 100, 100.5, 100.50, but not .5 or 100.555 or -10
    if (!/^\d+(\.\d{1,2})?$/.test(clean)) {
      return null;
    }

    const parts = clean.split('.');
    const rupees = parseInt(parts[0], 10);
    let paise = 0;
    if (parts[1]) {
      paise = parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10);
    }
    const totalPaise = rupees * 100 + paise;
    return totalPaise > 0 ? totalPaise : null;
  }

  return null;
}

/**
 * Formats integer paise into Indian Rupee format string.
 * Example: 10000000 paise -> "₹1,00,000.00"
 * 
 * @param {number} paise
 * @returns {string}
 */
export function formatPaiseToINR(paise) {
  if (typeof paise !== 'number' || !Number.isFinite(paise)) {
    return '₹0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;

  // Format integer rupee part with Indian numbering system (xx,xx,xxx)
  const rupeeString = rupees.toString();
  let formattedRupees = '';

  if (rupeeString.length <= 3) {
    formattedRupees = rupeeString;
  } else {
    const lastThree = rupeeString.substring(rupeeString.length - 3);
    const otherNumbers = rupeeString.substring(0, rupeeString.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedRupees = `${withCommas},${lastThree}`;
  }

  const paiseString = remPaise.toString().padStart(2, '0');
  const result = `₹${formattedRupees}.${paiseString}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Converts paise to a float Rupee number (for convenience/display in JSON)
 * @param {number} paise 
 * @returns {number}
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || !Number.isFinite(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}
