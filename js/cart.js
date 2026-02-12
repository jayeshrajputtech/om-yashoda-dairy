/**
 * Shopping Cart Management Module
 * 
 * This module handles all shopping cart operations including:
 * - Adding/removing/updating items
 * - Cart persistence using localStorage
 * - Cart calculations (subtotal, total)
 * - Cart UI rendering
 * 
 * SECURITY NOTE: Cart data is stored client-side only. Final validation
 * happens server-side during checkout to prevent price manipulation.
 * 
 * @module cart
 * @requires ./config.js
 * @requires ./utils.js
 * @requires ./products.js
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { CONFIG } from './config.js';
import {
    formatCurrency,
    sanitizeInput,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    showToast
} from './utils.js';
import { getProductById } from './products.js';

// ==================== Cart State Management ====================

/**
 * Get current cart from localStorage
 * 
 * Cart structure: Array of {productId, quantity}
 * 
 * @returns {Array} Array of cart items
 * 
 * @example
 * const cart = getCart();
 * console.log(`Cart has ${cart.length} items`);
 */
export function getCart() {
    return loadFromStorage(CONFIG.STORAGE_KEYS.CART, []);
}

/**
 * Save cart to localStorage
 * 
 * @private
 * @param {Array} cart - Cart array to save
 * @returns {boolean} True if successful
 */
function saveCart(cart) {
    const success = saveToStorage(CONFIG.STORAGE_KEYS.CART, cart);

    // Update cart badge count in UI
    updateCartBadge();

    return success;
}

/**
 * Add item to cart or increase quantity if already exists
 * 
 * @param {string} productId - Product ID to add
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Promise<boolean>} True if successful
 * 
 * @example
 * await addToCart('buffalo-ghee', 2);
 * showToast('Added to cart!', 'success');
 */
export async function addToCart(productId, quantity = 1) {
    try {
        // Validate product exists and is in stock
        const product = await getProductById(productId);

        if (!product) {
            showToast('Product not found', 'error');
            return false;
        }

        if (!product.inStock) {
            showToast('Product is out of stock', 'error');
            return false;
        }

        // Get current cart
        const cart = getCart();

        // Check if product already in cart
        const existingItem = cart.find(item => item.productId === productId);

        if (existingItem) {
            // Increase quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.push({
                productId,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Save updated cart
        const success = saveCart(cart);

        if (success) {
            showToast(`Added ${product.nameEnglish} to cart`, 'success');
        }

        return success;
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Failed to add item to cart', 'error');
        return false;
    }
}

/**
 * Update quantity of an item in cart
 * 
 * @param {string} productId - Product ID
 * @param {number} newQuantity - New quantity (must be > 0)
 * @returns {boolean} True if successful
 * 
 * @example
 * updateCartItem('buffalo-ghee', 3);
 */
export function updateCartItem(productId, newQuantity) {
    if (newQuantity < 1) {
        return removeFromCart(productId);
    }

    const cart = getCart();
    const item = cart.find(item => item.productId === productId);

    if (!item) {
        showToast('Item not found in cart', 'error');
        return false;
    }

    item.quantity = newQuantity;
    return saveCart(cart);
}

/**
 * Remove item from cart
 * 
 * @param {string} productId - Product ID to remove
 * @returns {boolean} True if successful
 * 
 * @example
 * removeFromCart('buffalo-ghee');
 * showToast('Item removed from cart', 'info');
 */
export function removeFromCart(productId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.productId !== productId);

    if (filteredCart.length === cart.length) {
        // Item wasn't in cart
        return false;
    }

    const success = saveCart(filteredCart);

    if (success) {
        showToast('Item removed from cart', 'info');
    }

    return success;
}

/**
 * Clear entire cart
 * 
 * @returns {boolean} True if successful
 * 
 * @example
 * clearCart();
 */
export function clearCart() {
    removeFromStorage(CONFIG.STORAGE_KEYS.CART);
    updateCartBadge();
    return true;
}

// ==================== Cart Calculations ====================

/**
 * Get cart with full product details
 * 
 * This function enriches cart items with complete product information
 * from the products catalog.
 * 
 * @returns {Promise<Array>} Array of cart items with product details
 * 
 * @example
 * const cartItems = await getCartWithDetails();
 * cartItems.forEach(item => {
 *   console.log(`${item.product.nameEnglish}: ${item.quantity} x ${item.product.price}`);
 * });
 */
export async function getCartWithDetails() {
    const cart = getCart();
    const cartWithDetails = [];

    for (const item of cart) {
        const product = await getProductById(item.productId);

        if (product) {
            cartWithDetails.push({
                ...item,
                product,
                subtotal: product.price * item.quantity
            });
        }
    }

    return cartWithDetails;
}

/**
 * Calculate cart subtotal (sum of all items)
 * 
 * @returns {Promise<number>} Subtotal amount in rupees
 * 
 * @example
 * const subtotal = await calculateSubtotal();
 * console.log(`Subtotal: ${formatCurrency(subtotal)}`);
 */
export async function calculateSubtotal() {
    const cartItems = await getCartWithDetails();
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Calculate delivery charge based on order amount
 * 
 * @param {number} subtotal - Order subtotal
 * @returns {number} Delivery charge in rupees
 * 
 * @example
 * const deliveryCharge = calculateDeliveryCharge(500);
 */
export function calculateDeliveryCharge(subtotal) {
    // Free delivery if subtotal meets minimum order amount
    if (subtotal >= CONFIG.MIN_ORDER_AMOUNT) {
        return CONFIG.DELIVERY_CHARGE;
    }

    // Could implement distance-based or tiered delivery charges here
    return CONFIG.DELIVERY_CHARGE;
}

/**
 * Calculate cart total (subtotal + delivery)
 * 
 * @returns {Promise<Object>} Object with subtotal, delivery, and total
 * 
 * @example
 * const totals = await calculateTotal();
 * console.log(`Total: ${formatCurrency(totals.total)}`);
 */
export async function calculateTotal() {
    const subtotal = await calculateSubtotal();
    const delivery = calculateDeliveryCharge(subtotal);
    const total = subtotal + delivery;

    return {
        subtotal,
        delivery,
        total
    };
}

/**
 * Get total number of items in cart
 * 
 * @returns {number} Total item count
 * 
 * @example
 * const count = getCartCount();
 * // If cart has: 2x ghee, 3x milk = returns 5
 */
export function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get number of unique products in cart
 * 
 * @returns {number} Number of unique products
 * 
 * @example
 * const uniqueCount = getUniqueItemCount();
 * // If cart has: 2x ghee, 3x milk = returns 2
 */
export function getUniqueItemCount() {
    const cart = getCart();
    return cart.length;
}

// ==================== UI Functions ====================

/**
 * Update cart badge count in navigation
 * 
 * This function updates the cart icon badge to show the current item count.
 * Called automatically when cart changes.
 * 
 * @example
 * updateCartBadge();
 */
export function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;

    const count = getCartCount();

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Render cart items in cart page
 * 
 * @param {string} containerId - ID of container element
 * @param {string} language - Display language
 * 
 * @example
 * await renderCartItems('cart-items-container', 'en');
 */
export async function renderCartItems(containerId, language = 'en') {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }

    const cartItems = await getCartWithDetails();

    if (cartItems.length === 0) {
        container.innerHTML = `
      <div class="empty-cart">
        <svg class="empty-icon" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2"/>
          <path d="M20 30h8l4 20h20l5-15H30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="35" cy="60" r="3" fill="currentColor"/>
          <circle cx="55" cy="60" r="3" fill="currentColor"/>
        </svg>
        <h2>Your cart is empty</h2>
        <p>Add some delicious dairy products to get started!</p>
        <a href="products.html" class="btn btn-primary">Browse Products</a>
      </div>
    `;
        return;
    }

    const html = cartItems.map(item => {
        const product = item.product;
        const primaryName = language === 'hi' ? product.nameHindi :
            language === 'mr' ? product.nameMarathi :
                product.nameEnglish;

        return `
      <div class="cart-item" data-product-id="${product.id}">
        <img 
          src="${sanitizeInput(product.image)}" 
          alt="${sanitizeInput(primaryName)}"
          class="cart-item-image"
        />
        
        <div class="cart-item-details">
          <h3 class="cart-item-name">${sanitizeInput(primaryName)}</h3>
          <p class="cart-item-unit">${formatCurrency(product.price)} per ${sanitizeInput(product.unit)}</p>
        </div>
        
        <div class="cart-item-quantity">
          <button 
            class="btn-quantity btn-decrease" 
            data-product-id="${product.id}"
            aria-label="Decrease quantity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <input 
            type="number" 
            class="quantity-input" 
            value="${item.quantity}"
            min="1"
            max="99"
            data-product-id="${product.id}"
            aria-label="Quantity"
          />
          
          <button 
            class="btn-quantity btn-increase" 
            data-product-id="${product.id}"
            aria-label="Increase quantity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="cart-item-subtotal">
          ${formatCurrency(item.subtotal)}
        </div>
        
        <button 
          class="btn-remove" 
          data-product-id="${product.id}"
          aria-label="Remove item"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
    }).join('');

    container.innerHTML = html;
}

/**
 * Render cart summary (subtotal, delivery, total)
 * 
 * @param {string} containerId - ID of container element
 * 
 * @example
 * await renderCartSummary('cart-summary');
 */
export async function renderCartSummary(containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }

    const totals = await calculateTotal();
    const itemCount = getCartCount();

    const deliveryText = totals.delivery === 0 ? 'FREE' : formatCurrency(totals.delivery);

    container.innerHTML = `
    <div class="summary-row">
      <span>Subtotal (${itemCount} items)</span>
      <span>${formatCurrency(totals.subtotal)}</span>
    </div>
    
    <div class="summary-row">
      <span>Delivery Charges</span>
      <span class="${totals.delivery === 0 ? 'text-success' : ''}">${deliveryText}</span>
    </div>
    
    <div class="summary-divider"></div>
    
    <div class="summary-row summary-total">
      <span>Total Amount</span>
      <span>${formatCurrency(totals.total)}</span>
    </div>
  `;
}

// ==================== Event Handlers ====================

/**
 * Initialize cart event listeners
 * 
 * This function should be called on cart.html page load to set up
 * all interactive cart functionality.
 * 
 * @example
 * // In cart.html
 * document.addEventListener('DOMContentLoaded', () => {
 *   initCartEventListeners();
 * });
 */
export function initCartEventListeners() {
    // Delegate events to handle dynamically rendered cart items
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const productId = target.dataset.productId;
        if (!productId) return;

        // Handle quantity decrease
        if (target.classList.contains('btn-decrease')) {
            const cart = getCart();
            const item = cart.find(i => i.productId === productId);
            if (item) {
                updateCartItem(productId, item.quantity - 1);
                await refreshCartUI();
            }
        }

        // Handle quantity increase
        if (target.classList.contains('btn-increase')) {
            const cart = getCart();
            const item = cart.find(i => i.productId === productId);
            if (item) {
                updateCartItem(productId, item.quantity + 1);
                await refreshCartUI();
            }
        }

        // Handle remove item
        if (target.classList.contains('btn-remove')) {
            removeFromCart(productId);
            await refreshCartUI();
        }
    });

    // Handle manual quantity input
    document.addEventListener('change', async (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const productId = e.target.dataset.productId;
            const newQuantity = parseInt(e.target.value, 10);

            if (newQuantity > 0 && newQuantity <= 99) {
                updateCartItem(productId, newQuantity);
                await refreshCartUI();
            } else {
                // Reset to current quantity if invalid
                const cart = getCart();
                const item = cart.find(i => i.productId === productId);
                if (item) {
                    e.target.value = item.quantity;
                }
            }
        }
    });
}

/**
 * Refresh cart UI after changes
 * 
 * @private
 * @example
 * await refreshCartUI();
 */
async function refreshCartUI() {
    await renderCartItems('cart-items-container');
    await renderCartSummary('cart-summary');
}

// ==================== Validation ====================

/**
 * Validate cart before checkout
 * 
 * Checks for:
 * - Empty cart
 * - Out of stock items
 * - Minimum order amount
 * 
 * @returns {Promise<Object>} Validation result {isValid, errors}
 * 
 * @example
 * const validation = await validateCart();
 * if (!validation.isValid) {
 *   validation.errors.forEach(error => showToast(error, 'error'));
 * }
 */
export async function validateCart() {
    const errors = [];
    const cart = getCart();

    // Check if cart is empty
    if (cart.length === 0) {
        errors.push('Your cart is empty');
        return { isValid: false, errors };
    }

    // Check if all items are still in stock
    const cartItems = await getCartWithDetails();
    const outOfStockItems = cartItems.filter(item => !item.product.inStock);

    if (outOfStockItems.length > 0) {
        outOfStockItems.forEach(item => {
            errors.push(`${item.product.nameEnglish} is out of stock`);
        });
    }

    // Check minimum order amount
    const totals = await calculateTotal();
    if (totals.subtotal < CONFIG.MIN_ORDER_AMOUNT) {
        errors.push(`Minimum order amount is ${formatCurrency(CONFIG.MIN_ORDER_AMOUNT)}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
