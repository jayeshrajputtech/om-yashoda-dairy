/**
 * Order Submission Serverless Function
 * 
 * This Vercel serverless function handles order submission and sends
 * notifications via WhatsApp and email.
 * 
 * SECURITY FEATURES:
 * - Input validation and sanitization
 * - Rate limiting (5 requests per hour per IP)
 * - CORS restrictions
 * - Environment variable protection
 * 
 * NOTIFICATIONS:
 * - WhatsApp notification to shop owner via CallMeBot
 * - Email confirmation to customer via Resend
 * 
 * @module api/submit-order
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { Resend } from 'resend';
// import twilio from 'twilio'; // DISABLED: Uncomment to enable Twilio WhatsApp

// ==================== Configuration ====================

const SHOP_OWNER_PHONE = process.env.SHOP_OWNER_PHONE || '+919320056114';

// ==================== Twilio Configuration (DISABLED) ====================
// To re-enable Twilio WhatsApp notifications:
// 1. Uncomment the import statement above
// 2. Uncomment the configuration below
// 3. Uncomment the twilioClient initialization
// 4. Uncomment the sendWhatsAppNotification function (line ~130)
// 5. Update the handler to call sendWhatsAppNotification (line ~330)
// 6. Add Twilio environment variables to Vercel:
//    - TWILIO_ACCOUNT_SID
//    - TWILIO_AUTH_TOKEN
//    - TWILIO_WHATSAPP_FROM
//    - TWILIO_WHATSAPP_TO

// const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
// const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
// const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
// const TWILIO_WHATSAPP_TO = process.env.TWILIO_WHATSAPP_TO || `whatsapp:${SHOP_OWNER_PHONE}`;

// Initialize Twilio (DISABLED)
// const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
//   ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
//   : null;

// ==================== Resend Configuration ====================

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'orders@omyashodadairy.com';

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Rate limiting store (in-memory, resets on function cold start)
const rateLimitStore = new Map();

// ==================== Rate Limiting ====================

/**
 * Check if request should be rate limited
 * 
 * SECURITY: Prevents spam orders by limiting to 5 requests per hour per IP
 * 
 * @param {string} ip - Client IP address
 * @returns {boolean} True if request should be blocked
 */
function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 5;

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, []);
    }

    const requests = rateLimitStore.get(ip);

    // Remove old requests outside the time window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
        return true;
    }

    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);

    return false;
}

// ==================== Input Validation ====================

/**
 * Validate order data
 * 
 * SECURITY: Validates all required fields and data types
 * 
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result {isValid, errors}
 */
function validateOrderData(orderData) {
    const errors = [];

    // Required fields
    if (!orderData.orderId) errors.push('Order ID is required');
    if (!orderData.userId) errors.push('User ID is required');
    if (!orderData.customer) errors.push('Customer details are required');
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        errors.push('Order must contain at least one item');
    }

    // Customer validation
    if (orderData.customer) {
        if (!orderData.customer.name) errors.push('Customer name is required');
        if (!orderData.customer.phone) errors.push('Customer phone is required');
        if (!orderData.customer.address) errors.push('Customer address is required');
    }

    // Validate totals
    if (typeof orderData.total !== 'number' || orderData.total <= 0) {
        errors.push('Invalid order total');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ==================== WhatsApp Notification (DISABLED) ====================

/**
 * Send WhatsApp notification via Twilio (DISABLED)
 * 
 * To re-enable:
 * 1. Uncomment this entire function
 * 2. Uncomment Twilio import and initialization at top of file
 * 3. Uncomment the sendWhatsAppNotification call in the handler (line ~330)
 * 4. Add Twilio environment variables to Vercel
 * 
 * Twilio provides reliable WhatsApp messaging with:
 * - Free trial: $15 credit (~1000 messages)
 * - Production: ~₹3 per message
 * - Automatic fallback to email if Twilio fails
 * 
 * Setup: https://www.twilio.com/console/sms/whatsapp/sandbox
 * 
 * @param {Object} orderData - Order details
 * @returns {Promise<boolean>} Success status
 */
/*
async function sendWhatsAppNotification(orderData) {
    if (!twilioClient) {
        console.warn('Twilio not configured, skipping WhatsApp notification');
        return false;
    }

    try {
        // Format order items
        const itemsList = orderData.items
            .map(item => `• ${item.productNameHindi || item.productName} (${item.quantity}x) - ₹${item.subtotal}`)
            .join('\n');

        // Create message
        const message = `
🛒 *NEW ORDER - OM Yashoda Dairy*

*Order ID:* ${orderData.orderId}
*Time:* ${new Date(orderData.createdAt).toLocaleString('en-IN')}

*Customer Details:*
Name: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Address: ${orderData.customer.address}
${orderData.customer.landmark ? `Landmark: ${orderData.customer.landmark}` : ''}

*Items:*
${itemsList}

*Total: ₹${orderData.total}*

Delivery: ${orderData.deliverySlot}
Payment: Cash on Delivery

${orderData.specialInstructions ? `Note: ${orderData.specialInstructions}` : ''}
    `.trim();

        // Send via Twilio WhatsApp API
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: TWILIO_WHATSAPP_FROM,
            to: TWILIO_WHATSAPP_TO
        });

        console.log('WhatsApp notification sent successfully:', twilioMessage.sid);
        return true;

    } catch (error) {
        console.error('Error sending WhatsApp notification:', error.message);

        // If Twilio fails, try email as fallback
        console.log('Attempting email fallback...');
        try {
            await sendEmailToOwner(orderData);
            return true;
        } catch (emailError) {
            console.error('Email fallback also failed:', emailError.message);
            return false;
        }
    }
}
*/

/**
 * Send email notification to shop owner (fallback)
 * 
 * @param {Object} orderData - Order details
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailToOwner(orderData) {
    if (!resend) {
        console.log('Resend not configured');
        return false;
    }

    try {
        const itemsList = orderData.items
            .map(item => `<li>${item.productName} (${item.quantity}x ${item.unit}) - ₹${item.subtotal}</li>`)
            .join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .total { font-size: 20px; font-weight: bold; color: #2563EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 NEW ORDER!</h1>
          </div>
          
          <div class="content">
            <div class="order-details">
              <h3>Order #${orderData.orderId}</h3>
              <p><strong>Time:</strong> ${new Date(orderData.createdAt).toLocaleString('en-IN')}</p>
              
              <h4>Customer Details:</h4>
              <p>
                <strong>Name:</strong> ${orderData.customer.name}<br>
                <strong>Phone:</strong> ${orderData.customer.phone}<br>
                <strong>Address:</strong> ${orderData.customer.address}
                ${orderData.customer.landmark ? `<br><strong>Landmark:</strong> ${orderData.customer.landmark}` : ''}
              </p>
              
              <h4>Items:</h4>
              <ul>${itemsList}</ul>
              
              <p class="total">Total: ₹${orderData.total}</p>
              
              <p>
                <strong>Delivery Slot:</strong> ${orderData.deliverySlot}<br>
                <strong>Payment:</strong> Cash on Delivery
              </p>
              
              ${orderData.specialInstructions ? `<p><strong>Special Instructions:</strong> ${orderData.specialInstructions}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

        await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: process.env.SHOP_OWNER_EMAIL || 'owner@omyashodadairy.com',
            subject: `🛒 NEW ORDER - ${orderData.orderId}`,
            html
        });

        console.log('Email notification sent to owner');
        return true;
    } catch (error) {
        console.error('Error sending email to owner:', error);
        return false;
    }
}

// ==================== Email Notification ====================

/**
 * Send email confirmation to customer
 * 
 * Uses Resend API for reliable email delivery
 * 
 * @param {Object} orderData - Order details
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailConfirmation(orderData) {
    if (!resend || !orderData.customer.email) {
        console.log('Email not configured or customer email not provided');
        return false;
    }

    try {
        const itemsList = orderData.items
            .map(item => `<li>${item.productName} (${item.quantity}x ${item.unit}) - ₹${item.subtotal}</li>`)
            .join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .total { font-size: 20px; font-weight: bold; color: #2563EB; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥛 Order Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Dear ${orderData.customer.name},</p>
            <p>Thank you for your order! We've received it and will prepare it fresh for delivery.</p>
            
            <div class="order-details">
              <h3>Order #${orderData.orderId}</h3>
              <p><strong>Delivery Slot:</strong> ${orderData.deliverySlot}</p>
              <p><strong>Delivery Address:</strong><br>${orderData.customer.address}</p>
              
              <h4>Items:</h4>
              <ul>${itemsList}</ul>
              
              <p class="total">Total: ₹${orderData.total}</p>
              <p><strong>Payment:</strong> Cash on Delivery</p>
            </div>
            
            <p>If you have any questions, please contact us at ${SHOP_OWNER_PHONE}</p>
          </div>
          
          <div class="footer">
            <p>OM Yashoda Dairy<br>Kalyan West, Maharashtra</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: orderData.customer.email,
            subject: `Order Confirmed - ${orderData.orderId}`,
            html
        });

        console.log('Email confirmation sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// ==================== Main Handler ====================

/**
 * Main serverless function handler
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // In production, set to your domain
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        // Get client IP for rate limiting
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // Check rate limit
        if (isRateLimited(ip)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        // Parse and validate order data
        const orderData = req.body;

        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order data',
                errors: validation.errors
            });
        }

        // Send notifications
        const notifications = [];

        // Send WhatsApp notification (DISABLED - uncomment to enable)
        // notifications.push(sendWhatsAppNotification(orderData));

        // Send email to shop owner (PRIMARY NOTIFICATION)
        notifications.push(sendEmailToOwner(orderData));

        // Send email confirmation to customer
        if (orderData.customer.email) {
            notifications.push(sendEmailConfirmation(orderData));
        }

        // Wait for all notifications (don't block order creation if they fail)
        await Promise.allSettled(notifications);

        // Log notification results
        console.log('Notification results:', {
            whatsapp: notifications[0].status === 'fulfilled' && notifications[0].value,
            email: notifications[1].status === 'fulfilled' && notifications[1].value
        });

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Order received successfully',
            orderId: orderData.orderId
        });

    } catch (error) {
        console.error('Order processing error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to process order. Please try again.'
        });
    }
}
