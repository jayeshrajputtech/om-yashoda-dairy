/**
 * Checkout Module
 * 
 * Handles checkout form validation, order submission, and authentication.
 * 
 * SECURITY: All form data is validated client-side and server-side.
 * User must be authenticated before placing an order.
 * 
 * @module checkout
 * @requires ./config.js
 * @requires ./firebase-config.js
 * @requires ./cart.js
 * @requires ./utils.js
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { CONFIG } from './config.js';
import { AuthService, DatabaseService } from './firebase-config.js';
import { getCartWithDetails, calculateTotal, clearCart } from './cart.js';
import {
    validatePhone,
    validateEmail,
    sanitizeInput,
    showToast,
    showLoading,
    hideLoading,
    generateOrderId
} from './utils.js';

/**
 * Validate checkout form data
 * 
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result {isValid, errors}
 * 
 * @example
 * const result = validateCheckoutForm(formData);
 * if (!result.isValid) {
 *   result.errors.forEach(error => showToast(error, 'error'));
 * }
 */
export function validateCheckoutForm(formData) {
    const errors = [];

    // Validate name
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Please enter your full name');
    }

    // Validate phone
    if (!validatePhone(formData.phone)) {
        errors.push('Please enter a valid 10-digit mobile number');
    }

    // Validate email (optional but if provided, must be valid)
    if (formData.email && !validateEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }

    // Validate address
    if (!formData.address || formData.address.trim().length < 10) {
        errors.push('Please enter a complete delivery address');
    }

    // Validate delivery slot
    if (!formData.deliverySlot) {
        errors.push('Please select a delivery time slot');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Submit order to backend API
 * 
 * @param {Object} orderData - Complete order data
 * @returns {Promise<Object>} API response with order ID
 * @throws {Error} If submission fails
 * 
 * @example
 * const response = await submitOrder(orderData);
 * console.log('Order ID:', response.orderId);
 */
export async function submitOrder(orderData) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/submit-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit order');
        }

        return await response.json();
    } catch (error) {
        console.error('Order submission error:', error);
        throw error;
    }
}

/**
 * Process checkout and create order
 * 
 * This is the main checkout function that:
 * 1. Validates form data
 * 2. Gets cart items
 * 3. Creates order in database
 * 4. Sends notifications
 * 5. Clears cart
 * 
 * @param {Object} formData - Checkout form data
 * @param {Object} user - Authenticated user object
 * @returns {Promise<string>} Order ID
 * @throws {Error} If checkout fails
 * 
 * @example
 * const orderId = await processCheckout(formData, user);
 * window.location.href = `/confirmation.html?orderId=${orderId}`;
 */
export async function processCheckout(formData, user) {
    // Validate form
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    // Get cart items with details
    const cartItems = await getCartWithDetails();
    if (cartItems.length === 0) {
        throw new Error('Your cart is empty');
    }

    // Calculate totals
    const totals = await calculateTotal();

    // Generate order ID
    const orderId = generateOrderId();

    // Prepare order data
    const orderData = {
        orderId,
        userId: user.uid,
        customer: {
            name: sanitizeInput(formData.name),
            email: formData.email ? sanitizeInput(formData.email) : user.email,
            phone: sanitizeInput(formData.phone),
            address: sanitizeInput(formData.address),
            landmark: formData.landmark ? sanitizeInput(formData.landmark) : ''
        },
        items: cartItems.map(item => ({
            productId: item.productId,
            productName: item.product.nameEnglish,
            productNameHindi: item.product.nameHindi,
            quantity: item.quantity,
            price: item.product.price,
            unit: item.product.unit,
            subtotal: item.subtotal
        })),
        deliverySlot: formData.deliverySlot,
        specialInstructions: formData.specialInstructions ? sanitizeInput(formData.specialInstructions) : '',
        paymentMethod: 'Cash on Delivery',
        subtotal: totals.subtotal,
        deliveryCharge: totals.delivery,
        total: totals.total,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        // Save order to Firestore
        await DatabaseService.createOrder(orderData);

        // Submit to backend for notifications
        await submitOrder(orderData);

        // Update user profile with phone if not already set
        if (formData.phone) {
            await DatabaseService.updateUser(user.uid, {
                phone: formData.phone,
                address: formData.address
            });
        }

        // Clear cart
        clearCart();

        return orderId;
    } catch (error) {
        console.error('Checkout error:', error);
        throw new Error('Failed to process order. Please try again.');
    }
}
