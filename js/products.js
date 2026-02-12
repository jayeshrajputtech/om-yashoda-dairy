/**
 * Product Management Module
 * 
 * This module handles all product-related operations including:
 * - Loading products from JSON file
 * - Filtering and searching products
 * - Rendering product cards
 * - Managing product catalog display
 * 
 * @module products
 * @requires ./config.js
 * @requires ./utils.js
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { CONFIG } from './config.js';
import { formatCurrency, sanitizeInput, handleError, showToast } from './utils.js';

// ==================== Product Data Management ====================

/**
 * Cached products data to avoid repeated file reads
 * @type {Array|null}
 */
let cachedProducts = null;

/**
 * Cached categories data
 * @type {Array|null}
 */
let cachedCategories = null;

/**
 * Fetch all products from Firestore via API
 * 
 * SECURITY: Products are now fetched from Firestore via secure API endpoint
 * instead of client-side JSON file. This prevents:
 * - Price manipulation in browser
 * - Viewing all product data client-side
 * - Unauthorized product modifications
 * 
 * The API endpoint /api/products fetches from Firestore and returns only
 * active products that are in stock.
 * 
 * @returns {Promise<Array>} Array of product objects
 * @throws {Error} If fetching products fails
 * 
 * @example
 * const products = await fetchProducts();
 * console.log(`Loaded ${products.length} products`);
 */
export async function fetchProducts() {
    // Return cached data if available
    if (cachedProducts) {
        return cachedProducts;
    }

    try {
        // Fetch from secure API endpoint (Firestore)
        const response = await fetch('/api/products');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch products');
        }

        // Cache the products
        cachedProducts = data.products || [];

        console.log(`✅ Loaded ${cachedProducts.length} products from Firestore`);

        return cachedProducts;
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        handleError(error, true, 'Failed to load products. Please refresh the page.');
        throw error;
    }
}

/**
 * Get all product categories (derived from products)
 * 
 * @returns {Promise<Array>} Array of category objects
 * 
 * @example
 * const categories = await getCategories();
 * categories.forEach(cat => console.log(cat.id));
 */
export async function getCategories() {
    const products = await fetchProducts();

    // Extract unique categories
    const categorySet = new Set();
    const categoryMap = {};

    products.forEach(product => {
        if (!categorySet.has(product.category)) {
            categorySet.add(product.category);
            categoryMap[product.category] = {
                id: product.category,
                nameEnglish: product.category.charAt(0).toUpperCase() + product.category.slice(1),
                nameHindi: product.category,
                nameMarathi: product.category
            };
        }
    });

    // Add "All" category
    const categories = [
        {
            id: 'all',
            nameEnglish: 'All Products',
            nameHindi: 'सभी उत्पाद',
            nameMarathi: 'सर्व उत्पादने'
        },
        ...Object.values(categoryMap)
    ];

    return categories;
}

/**
 * Get a single product by ID
 * 
 * @param {string} productId - Product ID to find
 * @returns {Promise<Object|null>} Product object or null if not found
 * 
 * @example
 * const product = await getProductById('buffalo-ghee');
 * console.log(product.nameHindi);  // "भैंस का घी"
 */
export async function getProductById(productId) {
    const products = await fetchProducts();
    return products.find(p => p.id === productId) || null;
}

/**
 * Get featured products only
 * 
 * @returns {Promise<Array>} Array of featured products
 * 
 * @example
 * const featured = await getFeaturedProducts();
 * // Returns products where featured: true
 */
export async function getFeaturedProducts() {
    const products = await fetchProducts();
    return products.filter(p => p.featured === true);
}

// ==================== Filtering and Searching ====================

/**
 * Filter products by category
 * 
 * @param {Array} products - Array of all products
 * @param {string} category - Category ID to filter by ('all' returns all products)
 * @returns {Array} Filtered array of products
 * 
 * @example
 * const allProducts = await fetchProducts();
 * const premiumProducts = filterByCategory(allProducts, 'premium');
 */
export function filterByCategory(products, category) {
    if (!category || category === 'all') {
        return products;
    }

    return products.filter(p => p.category === category);
}

/**
 * Search products by name in all languages (English, Hindi, Marathi)
 * 
 * This function performs case-insensitive search across all three language names
 * and product descriptions, making it easy for users to find products in their
 * preferred language.
 * 
 * @param {Array} products - Array of all products
 * @param {string} query - Search query string
 * @returns {Array} Array of matching products
 * 
 * @example
 * const allProducts = await fetchProducts();
 * const results = searchProducts(allProducts, 'घी');
 * // Returns both buffalo ghee and cow ghee
 */
export function searchProducts(products, query) {
    if (!query || query.trim() === '') {
        return products;
    }

    const lowerQuery = query.toLowerCase().trim();

    return products.filter(product => {
        // Search in English name
        if (product.nameEnglish.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        // Search in Hindi name
        if (product.nameHindi && product.nameHindi.includes(query.trim())) {
            return true;
        }

        // Search in Marathi name
        if (product.nameMarathi && product.nameMarathi.includes(query.trim())) {
            return true;
        }

        // Search in descriptions
        if (product.description && product.description.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        return false;
    });
}

/**
 * Sort products by specified criteria
 * 
 * @param {Array} products - Array of products to sort
 * @param {string} sortBy - Sort criteria: 'name', 'price-low', 'price-high'
 * @returns {Array} Sorted array of products
 * 
 * @example
 * const sorted = sortProducts(products, 'price-low');
 * // Returns products sorted by price (lowest first)
 */
export function sortProducts(products, sortBy) {
    const sorted = [...products]; // Create a copy to avoid mutating original

    switch (sortBy) {
        case 'name':
            return sorted.sort((a, b) =>
                a.nameEnglish.localeCompare(b.nameEnglish)
            );

        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);

        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);

        default:
            return sorted;
    }
}

/**
 * Filter products by stock availability
 * 
 * @param {Array} products - Array of products
 * @param {boolean} inStockOnly - If true, return only in-stock products
 * @returns {Array} Filtered products
 * 
 * @example
 * const availableProducts = filterByStock(products, true);
 */
export function filterByStock(products, inStockOnly = true) {
    if (!inStockOnly) {
        return products;
    }

    return products.filter(p => p.inStock === true);
}

// ==================== Rendering Functions ====================

/**
 * Render a single product card HTML
 * 
 * This function generates the HTML for a product card with:
 * - Product image
 * - Names in all three languages
 * - Price
 * - Add to cart button
 * - Stock status badge
 * 
 * @param {Object} product - Product object
 * @param {string} language - Display language: 'en', 'hi', 'mr' (default: 'en')
 * @returns {string} HTML string for product card
 * 
 * @example
 * const cardHTML = renderProductCard(product, 'hi');
 * document.getElementById('products-grid').innerHTML += cardHTML;
 */
export function renderProductCard(product, language = 'en') {
    // Determine which name to display prominently based on language
    let primaryName, secondaryName;

    switch (language) {
        case 'hi':
            primaryName = product.nameHindi;
            secondaryName = product.nameEnglish;
            break;
        case 'mr':
            primaryName = product.nameMarathi;
            secondaryName = product.nameEnglish;
            break;
        default:
            primaryName = product.nameEnglish;
            secondaryName = product.nameHindi;
    }

    // Stock badge
    const stockBadge = product.inStock
        ? '<span class="badge badge-success">In Stock</span>'
        : '<span class="badge badge-danger">Out of Stock</span>';

    // Featured badge
    const featuredBadge = product.featured
        ? '<span class="badge badge-premium">Premium</span>'
        : '';

    return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image-wrapper">
        <img 
          src="${sanitizeInput(product.image)}" 
          alt="${sanitizeInput(primaryName)}"
          class="product-image"
          loading="lazy"
        />
        <div class="product-badges">
          ${featuredBadge}
          ${stockBadge}
        </div>
      </div>
      
      <div class="product-info">
        <h3 class="product-name-primary">${sanitizeInput(primaryName)}</h3>
        <p class="product-name-secondary">${sanitizeInput(secondaryName)}</p>
        
        <div class="product-pricing">
          <span class="product-price">${formatCurrency(product.price)}</span>
          <span class="product-unit">per ${sanitizeInput(product.unit)}</span>
        </div>
        
        <button 
          class="btn btn-primary btn-add-to-cart"
          data-product-id="${product.id}"
          ${!product.inStock ? 'disabled' : ''}
        >
          <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2h2l1.5 9h7l2-6H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="7" cy="14" r="1" fill="currentColor"/>
            <circle cx="12" cy="14" r="1" fill="currentColor"/>
          </svg>
          ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render multiple product cards into a container
 * 
 * @param {Array} products - Array of products to render
 * @param {string} containerId - ID of container element
 * @param {string} language - Display language
 * 
 * @example
 * const products = await fetchProducts();
 * renderProductGrid(products, 'products-container', 'en');
 */
export function renderProductGrid(products, containerId, language = 'en') {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/>
          <path d="M32 20v16M32 44h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
        return;
    }

    // Render all product cards
    const html = products.map(product => renderProductCard(product, language)).join('');
    container.innerHTML = html;
}

/**
 * Render category filter buttons
 * 
 * @param {string} containerId - ID of container element
 * @param {string} activeCategory - Currently active category ID
 * @param {string} language - Display language
 * 
 * @example
 * await renderCategoryFilters('category-filters', 'all', 'en');
 */
export async function renderCategoryFilters(containerId, activeCategory = 'all', language = 'en') {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }

    const categories = await getCategories();

    const html = categories.map(category => {
        const isActive = category.id === activeCategory;
        let categoryName;

        switch (language) {
            case 'hi':
                categoryName = category.nameHindi;
                break;
            case 'mr':
                categoryName = category.nameMarathi;
                break;
            default:
                categoryName = category.nameEnglish;
        }

        return `
      <button 
        class="btn btn-filter ${isActive ? 'active' : ''}"
        data-category="${category.id}"
      >
        ${sanitizeInput(categoryName)}
      </button>
    `;
    }).join('');

    container.innerHTML = html;
}

// ==================== Product Statistics ====================

/**
 * Get product statistics
 * 
 * @returns {Promise<Object>} Statistics object
 * 
 * @example
 * const stats = await getProductStats();
 * console.log(`Total products: ${stats.total}`);
 * console.log(`Average price: ${stats.averagePrice}`);
 */
export async function getProductStats() {
    const products = await fetchProducts();

    const total = products.length;
    const inStock = products.filter(p => p.inStock).length;
    const outOfStock = total - inStock;

    const prices = products.map(p => p.price);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / total;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const categoryCounts = {};
    products.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    return {
        total,
        inStock,
        outOfStock,
        averagePrice: Math.round(averagePrice),
        minPrice,
        maxPrice,
        categoryCounts
    };
}
