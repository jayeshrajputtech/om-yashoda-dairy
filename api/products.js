/**
 * Products API - Fetch products from Firestore
 * 
 * This serverless function provides secure access to product data stored in Firestore.
 * Products are no longer exposed client-side for security reasons.
 * 
 * Security Benefits:
 * - Product prices cannot be viewed/modified in browser
 * - Server-side validation during checkout
 * - Easy to add admin-only fields (cost, supplier, etc.)
 * 
 * @endpoint GET /api/products
 * @returns {Object} { products: Array<Product> }
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ==================== Firebase Admin Initialization ====================

// Initialize Firebase Admin (only once)
if (!getApps().length) {
    // In production, use service account from environment variable
    // In development, can use default credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        // Fallback: Use Firebase config from environment
        initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID
        });
    }
}

const db = getFirestore();

// ==================== Helper Functions ====================

/**
 * Fetch all active products from Firestore
 * 
 * @returns {Promise<Array>} Array of product objects
 */
async function getProductsFromFirestore() {
    try {
        const productsRef = db.collection('products');
        const snapshot = await productsRef
            .where('inStock', '==', true)
            .orderBy('category')
            .orderBy('nameEnglish')
            .get();

        if (snapshot.empty) {
            console.log('No products found in Firestore');
            return [];
        }

        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return products;
    } catch (error) {
        console.error('Error fetching products from Firestore:', error);
        throw error;
    }
}

// ==================== API Handler ====================

/**
 * Main API handler
 * 
 * GET /api/products - Returns all active products
 * 
 * Response format:
 * {
 *   success: true,
 *   products: [
 *     {
 *       id: "buffalo-ghee",
 *       nameEnglish: "Buffalo Ghee",
 *       nameHindi: "भैंस का घी",
 *       nameMarathi: "म्हशीचे तूप",
 *       price: 800,
 *       unit: "1kg",
 *       category: "premium",
 *       inStock: true,
 *       featured: true,
 *       image: "/images/products/buffalo-ghee.jpg"
 *     },
 *     ...
 *   ],
 *   count: 12
 * }
 */
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Fetch products from Firestore
        const products = await getProductsFromFirestore();

        // Return success response
        return res.status(200).json({
            success: true,
            products,
            count: products.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in products API:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            message: error.message
        });
    }
}
