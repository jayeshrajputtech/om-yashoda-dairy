/**
 * Utility Functions Module
 * 
 * This module contains reusable utility functions used throughout the application.
 * These functions handle common tasks like formatting, validation, and UI interactions.
 * 
 * @module utils
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { CONFIG } from './config.js';

// ==================== Formatting Functions ====================

/**
 * Format a number as Indian Rupees currency
 * 
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency string (e.g., "₹800" or "₹1,200")
 * 
 * @example
 * formatCurrency(800);     // Returns: "₹800"
 * formatCurrency(1200.50); // Returns: "₹1,201"
 */
export function formatCurrency(amount) {
    // Round to nearest rupee (no paise)
    const rounded = Math.round(amount);

    // Use Indian number formatting (lakhs and crores)
    return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Format a Date object or ISO string to human-readable format
 * 
 * @param {Date|string} date - Date object or ISO date string
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDateTime(new Date());                    // "12 Feb 2026, 10:30 PM"
 * formatDateTime('2026-02-12T22:30:00', false);  // "12 Feb 2026"
 */
export function formatDateTime(date, includeTime = true) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };

    if (includeTime) {
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = true;
    }

    return dateObj.toLocaleString('en-IN', options);
}

/**
 * Format phone number to display format
 * 
 * @param {string} phone - Phone number (with or without country code)
 * @returns {string} Formatted phone number
 * 
 * @example
 * formatPhoneNumber('9876543210');      // "+91 98765 43210"
 * formatPhoneNumber('+919876543210');   // "+91 98765 43210"
 */
export function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Extract last 10 digits (Indian mobile number)
    const number = digits.slice(-10);

    // Format as: +91 XXXXX XXXXX
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
}

// ==================== Validation Functions ====================

/**
 * Validate Indian mobile phone number
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * validatePhone('9876543210');     // true
 * validatePhone('+919876543210');  // true
 * validatePhone('1234567890');     // false (doesn't start with 6-9)
 */
export function validatePhone(phone) {
    return CONFIG.PHONE_REGEX.test(phone);
}

/**
 * Validate email address
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * validateEmail('user@example.com');  // true
 * validateEmail('invalid-email');     // false
 */
export function validateEmail(email) {
    return CONFIG.EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 * 
 * @example
 * validatePassword('abc');  // {isValid: false, message: 'Password must be at least 6 characters'}
 * validatePassword('password123');  // {isValid: true, message: 'Password is valid'}
 */
export function validatePassword(password) {
    if (!password || password.length < CONFIG.MIN_PASSWORD_LENGTH) {
        return {
            isValid: false,
            message: `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`
        };
    }

    return {
        isValid: true,
        message: 'Password is valid'
    };
}

/**
 * Sanitize user input to prevent XSS attacks
 * 
 * SECURITY: This function escapes HTML special characters to prevent
 * malicious script injection when displaying user-generated content.
 * 
 * @param {string} input - User input string
 * @returns {string} Sanitized string safe for HTML display
 * 
 * @example
 * sanitizeInput('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

// ==================== UI Functions ====================

/**
 * Show a toast notification message
 * 
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: from CONFIG)
 * 
 * @example
 * showToast('Order placed successfully!', 'success');
 * showToast('Please fill all required fields', 'error');
 */
export function showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to DOM
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading spinner overlay
 * 
 * @param {string} message - Optional loading message
 * 
 * @example
 * showLoading('Processing your order...');
 */
export function showLoading(message = 'Loading...') {
    // Remove existing loader if any
    hideLoading();

    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.id = 'global-loader';
    loader.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-message">${sanitizeInput(message)}</p>
  `;

    document.body.appendChild(loader);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

/**
 * Hide loading spinner overlay
 * 
 * @example
 * hideLoading();
 */
export function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
        document.body.style.overflow = ''; // Restore scrolling
    }
}

/**
 * Confirm action with user via modal dialog
 * 
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 * 
 * @example
 * const confirmed = await confirmAction('Are you sure you want to delete this item?');
 * if (confirmed) {
 *   // Proceed with deletion
 * }
 */
export function confirmAction(message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <p class="modal-message">${sanitizeInput(message)}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" data-action="cancel">${sanitizeInput(cancelText)}</button>
            <button class="btn btn-primary" data-action="confirm">${sanitizeInput(confirmText)}</button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        // Handle button clicks
        modal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                modal.remove();
                resolve(action === 'confirm');
            }
        });
    });
}

// ==================== Storage Functions ====================

/**
 * Save data to localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} True if successful, false otherwise
 * 
 * @example
 * saveToStorage('cart', [{id: 'ghee', quantity: 2}]);
 */
export function saveToStorage(key, value) {
    try {
        const jsonValue = JSON.stringify(value);
        localStorage.setItem(key, jsonValue);
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Failed to save data locally', 'error');
        return false;
    }
}

/**
 * Load data from localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or default value
 * 
 * @example
 * const cart = loadFromStorage('cart', []);
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const jsonValue = localStorage.getItem(key);
        return jsonValue ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage
 * 
 * @param {string} key - Storage key
 * 
 * @example
 * removeFromStorage('cart');
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

// ==================== Debounce Function ====================

/**
 * Debounce a function to limit how often it can be called
 * Useful for search inputs, resize handlers, etc.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // Called multiple times rapidly, but only executes once after 300ms
 * debouncedSearch('milk');
 * debouncedSearch('milk ghee');
 * debouncedSearch('milk ghee paneer');
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== URL Functions ====================

/**
 * Get query parameter from URL
 * 
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value or null if not found
 * 
 * @example
 * // URL: https://example.com?orderId=123
 * getQueryParam('orderId');  // Returns: '123'
 */
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Update URL query parameter without page reload
 * 
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 * 
 * @example
 * setQueryParam('category', 'premium');
 * // URL changes to: https://example.com?category=premium
 */
export function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// ==================== Session Management ====================

/**
 * Check if user session has expired
 * 
 * SECURITY: Sessions expire after CONFIG.SESSION_TIMEOUT milliseconds
 * of inactivity to protect user accounts.
 * 
 * @returns {boolean} True if session expired, false otherwise
 */
export function isSessionExpired() {
    const lastActivity = loadFromStorage('lastActivity');
    if (!lastActivity) return false;

    const now = Date.now();
    const elapsed = now - lastActivity;

    return elapsed > CONFIG.SESSION_TIMEOUT;
}

/**
 * Update last activity timestamp
 * Call this on user interactions to keep session alive
 * 
 * @example
 * // Call on page load and user interactions
 * updateLastActivity();
 */
export function updateLastActivity() {
    saveToStorage('lastActivity', Date.now());
}

// ==================== Error Handling ====================

/**
 * Log error to console and optionally show to user
 * 
 * @param {Error} error - Error object
 * @param {boolean} showToUser - Whether to show error toast to user
 * @param {string} userMessage - Custom message to show user
 * 
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   handleError(error, true, 'Failed to load products');
 * }
 */
export function handleError(error, showToUser = false, userMessage = 'An error occurred') {
    // Log full error details to console for debugging
    console.error('Error:', error);

    // Show user-friendly message if requested
    if (showToUser) {
        showToast(userMessage, 'error');
    }
}

// ==================== Generate Unique ID ====================

/**
 * Generate a unique order ID
 * Format: ORD-YYYYMMDD-XXX (e.g., ORD-20260212-001)
 * 
 * @returns {string} Unique order ID
 * 
 * @example
 * const orderId = generateOrderId();  // "ORD-20260212-001"
 */
export function generateOrderId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Copy text to clipboard
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 * 
 * @example
 * await copyToClipboard('ORD-20260212-001');
 * showToast('Order ID copied!', 'success');
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

// ==================== Scroll Functions ====================

/**
 * Smooth scroll to element
 * 
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top in pixels (default: 80 for fixed header)
 * 
 * @example
 * scrollToElement('products-section');
 */
export function scrollToElement(elementId, offset = 80) {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.offsetTop - offset;
        window.scrollTo({
            top,
            behavior: 'smooth'
        });
    }
}

/**
 * Scroll to top of page
 * 
 * @example
 * scrollToTop();
 */
export function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
