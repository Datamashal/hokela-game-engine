/**
 * Utility functions for mapping wheel prizes to product inventory IDs
 */

// Map wheel prize labels to standardized product IDs
const PRODUCT_MAPPING = {
  // Water bottles
  'water_bottles': ['water bottles', 'water bottle', 'waterbottles', 'waterbottle'],
  
  // Key holders  
  'key_holders': ['key holders', 'keyholders', 'keyholder', 'key holder'],
  
  // Umbrellas
  'umbrellas': ['umbrellas', 'umbrella'],
  
  // Generic win (for products not in inventory)
  'win': ['win', 'prize', 'gift']
};

/**
 * Convert a wheel prize label to a standardized product ID
 * @param {string} prizeLabel - The prize label from the wheel
 * @returns {string|null} - Standardized product ID or null if not found
 */
function mapPrizeToProductId(prizeLabel) {
  if (!prizeLabel || typeof prizeLabel !== 'string') {
    return null;
  }

  // Clean the prize label
  const cleanLabel = prizeLabel.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters including emojis
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  // Find matching product ID
  for (const [productId, variations] of Object.entries(PRODUCT_MAPPING)) {
    if (variations.some(variation => cleanLabel.includes(variation))) {
      return productId;
    }
  }

  // If no match found, return a generic product ID based on cleaned label
  return cleanLabel.replace(/\s+/g, '_');
}

/**
 * Get all possible product IDs that could be on the wheel
 * @returns {string[]} - Array of product IDs
 */
function getAllProductIds() {
  return Object.keys(PRODUCT_MAPPING);
}

/**
 * Get variations for a specific product ID
 * @param {string} productId - The product ID
 * @returns {string[]} - Array of label variations
 */
function getProductVariations(productId) {
  return PRODUCT_MAPPING[productId] || [];
}

/**
 * Validate if a prize is a legitimate product win
 * @param {string} prizeLabel - The prize label
 * @returns {boolean} - True if it's a product win, false for "Try Again"
 */
function isProductWin(prizeLabel) {
  if (!prizeLabel || typeof prizeLabel !== 'string') {
    return false;
  }

  const cleanLabel = prizeLabel.toLowerCase().trim();
  return cleanLabel !== 'try again' && cleanLabel !== 'lose' && cleanLabel !== 'nothing';
}

module.exports = {
  mapPrizeToProductId,
  getAllProductIds,
  getProductVariations,
  isProductWin,
  PRODUCT_MAPPING
};