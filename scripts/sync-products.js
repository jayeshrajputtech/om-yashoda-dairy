#!/usr/bin/env node

/**
 * Product Sync Script
 * 
 * Syncs products from data/products.json to Firestore database.
 * This script is run:
 * 1. Manually for initial setup
 * 2. Automatically via GitHub Actions when products.json changes
 * 
 * Usage:
 *   node scripts/sync-products.js
 * 
 * Environment Variables Required:
 *   - FIREBASE_SERVICE_ACCOUNT (JSON string of service account)
 *   - VITE_FIREBASE_PROJECT_ID (Firebase project ID)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== Firebase Admin Initialization ====================

console.log('🔧 Initializing Firebase Admin...');

if (!getApps().length) {
    let serviceAccount = null;
    try {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : null;
    } catch (e) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
        console.error('⚠️  Ensure the secret contains the raw JSON object, starting with { and ending with }');
        // Do not log the secret itself for security
    }

    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized with service account');
    } else {
        // Fallback for local development
        initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID
        });
        console.log('✅ Firebase Admin initialized with project ID');
    }
}

const db = getFirestore();

// ==================== Helper Functions ====================

/**
 * Load products from JSON file
 */
function loadProductsFromJSON() {
    try {
        const productsPath = join(__dirname, '../data/products.json');
        const productsData = readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);

        console.log(`📦 Loaded ${products.length} products from JSON`);
        return products;
    } catch (error) {
        console.error('❌ Error loading products.json:', error.message);
        throw error;
    }
}

/**
 * Get existing products from Firestore
 */
async function getExistingProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const products = {};

        snapshot.forEach(doc => {
            products[doc.id] = doc.data();
        });

        console.log(`📊 Found ${Object.keys(products).length} existing products in Firestore`);
        return products;
    } catch (error) {
        console.error('❌ Error fetching existing products:', error.message);
        throw error;
    }
}

/**
 * Sync products to Firestore
 */
async function syncProducts() {
    console.log('\n🚀 Starting product sync...\n');

    const stats = {
        added: 0,
        updated: 0,
        unchanged: 0,
        errors: 0
    };

    try {
        // Load products from JSON
        const jsonProducts = loadProductsFromJSON();
        const existingProducts = await getExistingProducts();

        // Process each product
        for (const product of jsonProducts) {
            try {
                const productId = product.id;
                const productRef = db.collection('products').doc(productId);

                // Prepare product data
                const productData = {
                    id: product.id,
                    nameEnglish: product.nameEnglish,
                    nameHindi: product.nameHindi,
                    nameMarathi: product.nameMarathi,
                    price: product.price,
                    unit: product.unit,
                    category: product.category || 'regular',
                    inStock: product.inStock !== false, // Default to true
                    featured: product.featured || false,
                    image: product.image || `/images/products/${product.id}.jpg`,
                    updatedAt: FieldValue.serverTimestamp()
                };

                // Check if product exists
                if (existingProducts[productId]) {
                    // Update existing product
                    await productRef.update(productData);
                    console.log(`✏️  Updated: ${product.nameEnglish}`);
                    stats.updated++;
                } else {
                    // Add new product
                    productData.createdAt = FieldValue.serverTimestamp();
                    await productRef.set(productData);
                    console.log(`➕ Added: ${product.nameEnglish}`);
                    stats.added++;
                }

            } catch (error) {
                console.error(`❌ Error syncing ${product.nameEnglish}:`, error.message);
                stats.errors++;
            }
        }

        // Summary
        console.log('\n📊 Sync Summary:');
        console.log(`   ➕ Added: ${stats.added}`);
        console.log(`   ✏️  Updated: ${stats.updated}`);
        console.log(`   ❌ Errors: ${stats.errors}`);
        console.log(`   📦 Total: ${jsonProducts.length}`);

        if (stats.errors === 0) {
            console.log('\n✅ Product sync completed successfully!\n');
            process.exit(0);
        } else {
            console.log('\n⚠️  Product sync completed with errors\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Fatal error during sync:', error.message);
        process.exit(1);
    }
}

// ==================== Run Sync ====================

syncProducts();
