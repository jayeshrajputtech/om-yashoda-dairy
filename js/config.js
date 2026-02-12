/**
 * Application Configuration Module
 * 
 * This module contains all application-wide configuration constants.
 * Centralizing configuration makes it easy to update settings without
 * searching through multiple files.
 * 
 * @module config
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

/**
 * Main application configuration object
 * @constant {Object}
 */
export const CONFIG = {
  // ==================== Shop Information ====================
  
  /**
   * Official shop name displayed throughout the website
   * @type {string}
   */
  SHOP_NAME: 'OM Yashoda Dairy',
  
  /**
   * Shop name in Hindi (Devanagari script)
   * @type {string}
   */
  SHOP_NAME_HINDI: 'ॐ यशोदा डेयरी',
  
  /**
   * Shop name in Marathi (Devanagari script)
   * @type {string}
   */
  SHOP_NAME_MARATHI: 'ॐ यशोदा डेअरी',
  
  /**
   * Complete shop address
   * @type {string}
   */
  SHOP_ADDRESS: 'Hari Om Krupa Society, Rambaugh Lane Number 4, Kalyan West, 421301, Maharashtra, India',
  
  /**
   * Shop contact phone number (with country code)
   * @type {string}
   */
  SHOP_PHONE: '+91 9320056114',
  
  /**
   * Shop email address for customer inquiries
   * @type {string}
   */
  SHOP_EMAIL: 'info@omyashodadairy.com',
  
  // ==================== Business Hours ====================
  
  /**
   * Daily operating hours
   * @type {Object}
   */
  BUSINESS_HOURS: {
    /**
     * Opening time (24-hour format)
     * @type {string}
     */
    open: '06:00',
    
    /**
     * Closing time (24-hour format)
     * @type {string}
     */
    close: '22:00',
    
    /**
     * Days of operation
     * @type {string}
     */
    days: 'Monday - Sunday'
  },
  
  // ==================== Delivery Settings ====================
  
  /**
   * Delivery charge in rupees (0 = free delivery)
   * @type {number}
   */
  DELIVERY_CHARGE: 0,
  
  /**
   * Minimum order amount for delivery in rupees
   * @type {number}
   */
  MIN_ORDER_AMOUNT: 50,
  
  /**
   * Available delivery time slots
   * @type {Array<string>}
   */
  DELIVERY_SLOTS: [
    'Morning (7 AM - 10 AM)',
    'Afternoon (12 PM - 3 PM)',
    'Evening (5 PM - 8 PM)'
  ],
  
  // ==================== API Configuration ====================
  
  /**
   * Base URL for API endpoints (relative to domain)
   * @type {string}
   */
  API_BASE_URL: '/api',
  
  /**
   * API timeout in milliseconds
   * @type {number}
   */
  API_TIMEOUT: 10000,
  
  // ==================== LocalStorage Keys ====================
  
  /**
   * Keys used for browser localStorage
   * Using prefixed keys prevents conflicts with other websites
   * @type {Object}
   */
  STORAGE_KEYS: {
    /**
     * Shopping cart data
     * @type {string}
     */
    CART: 'om_dairy_cart',
    
    /**
     * User information (cached for convenience)
     * @type {string}
     */
    USER_INFO: 'om_dairy_user',
    
    /**
     * User preferences (language, etc.)
     * @type {string}
     */
    PREFERENCES: 'om_dairy_preferences'
  },
  
  // ==================== UI Configuration ====================
  
  /**
   * Default language for the interface
   * Options: 'en' (English), 'hi' (Hindi), 'mr' (Marathi)
   * @type {string}
   */
  DEFAULT_LANGUAGE: 'en',
  
  /**
   * Number of products to show per page in catalog
   * @type {number}
   */
  PRODUCTS_PER_PAGE: 12,
  
  /**
   * Toast notification duration in milliseconds
   * @type {number}
   */
  TOAST_DURATION: 3000,
  
  // ==================== Security Settings ====================
  
  /**
   * Maximum login attempts before temporary lockout
   * @type {number}
   */
  MAX_LOGIN_ATTEMPTS: 5,
  
  /**
   * Session timeout in milliseconds (30 minutes)
   * @type {number}
   */
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  // ==================== Validation Rules ====================
  
  /**
   * Regular expression for Indian mobile number validation
   * Matches: +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX (10 digits)
   * @type {RegExp}
   */
  PHONE_REGEX: /^(\+91|91)?[6-9]\d{9}$/,
  
  /**
   * Regular expression for email validation
   * @type {RegExp}
   */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /**
   * Minimum password length for user accounts
   * @type {number}
   */
  MIN_PASSWORD_LENGTH: 6,
  
  // ==================== Feature Flags ====================
  
  /**
   * Feature toggles for enabling/disabling functionality
   * Useful for gradual rollout of new features
   * @type {Object}
   */
  FEATURES: {
    /**
     * Enable user authentication (required for checkout)
     * @type {boolean}
     */
    AUTHENTICATION_REQUIRED: true,
    
    /**
     * Enable WhatsApp notifications
     * @type {boolean}
     */
    WHATSAPP_NOTIFICATIONS: true,
    
    /**
     * Enable email notifications
     * @type {boolean}
     */
    EMAIL_NOTIFICATIONS: true,
    
    /**
     * Enable online payment (future feature)
     * @type {boolean}
     */
    ONLINE_PAYMENT: false,
    
    /**
     * Enable product reviews (future feature)
     * @type {boolean}
     */
    PRODUCT_REVIEWS: false
  }
};

/**
 * Freeze the configuration object to prevent accidental modifications
 * This ensures configuration remains consistent throughout the application
 */
Object.freeze(CONFIG);
Object.freeze(CONFIG.BUSINESS_HOURS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.FEATURES);
