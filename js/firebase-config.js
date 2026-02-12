/**
 * Firebase Configuration and Initialization Module
 * 
 * This module handles all Firebase-related setup including:
 * - Firebase app initialization
 * - Authentication service
 * - Firestore database connection
 * 
 * SECURITY NOTE: Firebase config is safe to expose in client-side code.
 * The actual security is enforced through Firebase Security Rules.
 * 
 * MIGRATION STRATEGY: All database operations are abstracted through
 * a DatabaseService class, making it easy to swap Firebase for another
 * NoSQL solution (MongoDB, DynamoDB, etc.) in the future.
 * 
 * @module firebase-config
 * @requires firebase/app
 * @requires firebase/auth
 * @requires firebase/firestore
 * @author OM Yashoda Dairy Development Team
 * @version 1.0.0
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ==================== Firebase Configuration ====================

/**
 * Firebase project configuration
 * These values are obtained from Firebase Console > Project Settings
 * 
 * @constant {Object}
 * @property {string} apiKey - Firebase API key (safe to expose)
 * @property {string} authDomain - Firebase authentication domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 */
const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// ==================== Initialize Firebase ====================

/**
 * Initialize Firebase app with configuration
 * @type {FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication service instance
 * @type {Auth}
 */
export const auth = getAuth(app);

/**
 * Firestore database instance
 * @type {Firestore}
 */
export const db = getFirestore(app);

// ==================== Authentication Service ====================

/**
 * Authentication Service Class
 * 
 * Provides a clean interface for all authentication operations.
 * This abstraction makes it easier to switch auth providers if needed.
 * 
 * @class AuthService
 */
export class AuthService {
    /**
     * Register a new user with email and password
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password (min 6 characters)
     * @param {string} displayName - User's full name
     * @returns {Promise<Object>} User object with uid, email, displayName
     * @throws {Error} If registration fails
     * 
     * @example
     * const user = await AuthService.register('user@example.com', 'password123', 'John Doe');
     */
    static async register(email, password, displayName) {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile with display name
            await updateProfile(user, { displayName });

            // Create user document in Firestore
            await DatabaseService.createUser(user.uid, {
                email,
                displayName,
                createdAt: new Date().toISOString(),
                phone: null // Will be updated during first order
            });

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(this._getErrorMessage(error.code));
        }
    }

    /**
     * Sign in existing user with email and password
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<Object>} User object with uid, email, displayName
     * @throws {Error} If login fails
     * 
     * @example
     * const user = await AuthService.login('user@example.com', 'password123');
     */
    static async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            };
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(this._getErrorMessage(error.code));
        }
    }

    /**
     * Sign out current user
     * 
     * @returns {Promise<void>}
     * @throws {Error} If logout fails
     * 
     * @example
     * await AuthService.logout();
     */
    static async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw new Error('Failed to logout. Please try again.');
        }
    }

    /**
     * Send password reset email
     * 
     * @param {string} email - User's email address
     * @returns {Promise<void>}
     * @throws {Error} If sending email fails
     * 
     * @example
     * await AuthService.resetPassword('user@example.com');
     */
    static async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw new Error(this._getErrorMessage(error.code));
        }
    }

    /**
     * Sign in with Google
     * 
     * Opens Google sign-in popup and creates user profile if new user
     * 
     * @returns {Promise<Object>} User object with uid, email, displayName
     * @throws {Error} If Google sign-in fails
     * 
     * @example
     * const user = await AuthService.signInWithGoogle();
     */
    static async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists, create if not
            const existingUser = await DatabaseService.getUser(user.uid);
            if (!existingUser) {
                await DatabaseService.createUser(user.uid, {
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: new Date().toISOString(),
                    phone: null
                });
            }

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            };
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in cancelled');
            }
            throw new Error('Failed to sign in with Google. Please try again.');
        }
    }

    /**
     * Get current authenticated user
     * 
     * @returns {Object|null} Current user object or null if not authenticated
     * 
     * @example
     * const user = AuthService.getCurrentUser();
     * if (user) {
     *   console.log('Logged in as:', user.displayName);
     * }
     */
    static getCurrentUser() {
        const user = auth.currentUser;
        if (!user) return null;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    }

    /**
     * Listen for authentication state changes
     * 
     * @param {Function} callback - Function to call when auth state changes
     * @returns {Function} Unsubscribe function
     * 
     * @example
     * const unsubscribe = AuthService.onAuthChange((user) => {
     *   if (user) {
     *     console.log('User logged in:', user.email);
     *   } else {
     *     console.log('User logged out');
     *   }
     * });
     * // Later: unsubscribe();
     */
    static onAuthChange(callback) {
        return onAuthStateChanged(auth, (user) => {
            if (user) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                });
            } else {
                callback(null);
            }
        });
    }

    /**
     * Convert Firebase error codes to user-friendly messages
     * 
     * @private
     * @param {string} errorCode - Firebase error code
     * @returns {string} User-friendly error message
     */
    static _getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please login instead.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }
}

// ==================== Database Service ====================

/**
 * Database Service Class
 * 
 * Provides an abstraction layer over Firestore operations.
 * This design pattern (Repository Pattern) makes it easy to migrate
 * to a different database in the future without changing application code.
 * 
 * MIGRATION GUIDE:
 * To switch from Firebase to another NoSQL database:
 * 1. Keep this class interface unchanged
 * 2. Replace the implementation of each method
 * 3. Update the import statements at the top
 * 4. No changes needed in the rest of the application!
 * 
 * @class DatabaseService
 */
export class DatabaseService {
    /**
     * Collection names used in Firestore
     * Centralized for easy reference and updates
     * 
     * @static
     * @constant {Object}
     */
    static COLLECTIONS = {
        USERS: 'users',
        ORDERS: 'orders',
        PRODUCTS: 'products'
    };

    // ==================== User Operations ====================

    /**
     * Create a new user document in the database
     * 
     * @param {string} userId - Unique user ID (from Firebase Auth)
     * @param {Object} userData - User data object
     * @param {string} userData.email - User's email
     * @param {string} userData.displayName - User's full name
     * @param {string} userData.createdAt - ISO timestamp
     * @param {string|null} userData.phone - User's phone number
     * @returns {Promise<void>}
     * @throws {Error} If creation fails
     * 
     * @example
     * await DatabaseService.createUser('user123', {
     *   email: 'user@example.com',
     *   displayName: 'John Doe',
     *   createdAt: new Date().toISOString(),
     *   phone: '+919876543210'
     * });
     */
    static async createUser(userId, userData) {
        try {
            const userRef = doc(db, this.COLLECTIONS.USERS, userId);
            await setDoc(userRef, {
                ...userData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user profile');
        }
    }

    /**
     * Get user data by user ID
     * 
     * @param {string} userId - Unique user ID
     * @returns {Promise<Object|null>} User data or null if not found
     * @throws {Error} If retrieval fails
     * 
     * @example
     * const userData = await DatabaseService.getUser('user123');
     * console.log(userData.displayName);
     */
    static async getUser(userId) {
        try {
            const userRef = doc(db, this.COLLECTIONS.USERS, userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw new Error('Failed to retrieve user data');
        }
    }

    /**
     * Update user data
     * 
     * @param {string} userId - Unique user ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     * 
     * @example
     * await DatabaseService.updateUser('user123', {
     *   phone: '+919876543210',
     *   address: 'New address'
     * });
     */
    static async updateUser(userId, updates) {
        try {
            const userRef = doc(db, this.COLLECTIONS.USERS, userId);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user data');
        }
    }

    // ==================== Order Operations ====================

    /**
     * Create a new order in the database
     * 
     * @param {Object} orderData - Complete order information
     * @param {string} orderData.userId - User ID who placed the order
     * @param {Array} orderData.items - Array of order items
     * @param {Object} orderData.customer - Customer details
     * @param {number} orderData.total - Total order amount
     * @param {string} orderData.status - Order status
     * @returns {Promise<string>} Created order ID
     * @throws {Error} If creation fails
     * 
     * @example
     * const orderId = await DatabaseService.createOrder({
     *   userId: 'user123',
     *   items: [{productId: 'ghee', quantity: 2, price: 800}],
     *   customer: {name: 'John', phone: '+919876543210'},
     *   total: 1600,
     *   status: 'pending'
     * });
     */
    static async createOrder(orderData) {
        try {
            const ordersRef = collection(db, this.COLLECTIONS.ORDERS);
            const docRef = await addDoc(ordersRef, {
                ...orderData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating order:', error);
            throw new Error('Failed to create order');
        }
    }

    /**
     * Get order by ID
     * 
     * @param {string} orderId - Unique order ID
     * @returns {Promise<Object|null>} Order data or null if not found
     * @throws {Error} If retrieval fails
     * 
     * @example
     * const order = await DatabaseService.getOrder('order123');
     */
    static async getOrder(orderId) {
        try {
            const orderRef = doc(db, this.COLLECTIONS.ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                return { id: orderSnap.id, ...orderSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting order:', error);
            throw new Error('Failed to retrieve order');
        }
    }

    /**
     * Get all orders for a specific user
     * 
     * @param {string} userId - User ID
     * @param {number} limitCount - Maximum number of orders to return
     * @returns {Promise<Array>} Array of order objects
     * @throws {Error} If retrieval fails
     * 
     * @example
     * const orders = await DatabaseService.getUserOrders('user123', 10);
     */
    static async getUserOrders(userId, limitCount = 50) {
        try {
            const ordersRef = collection(db, this.COLLECTIONS.ORDERS);
            const q = query(
                ordersRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            return orders;
        } catch (error) {
            console.error('Error getting user orders:', error);
            throw new Error('Failed to retrieve orders');
        }
    }

    /**
     * Update order status
     * 
     * @param {string} orderId - Order ID
     * @param {string} status - New status (pending, confirmed, delivered, cancelled)
     * @returns {Promise<void>}
     * @throws {Error} If update fails
     * 
     * @example
     * await DatabaseService.updateOrderStatus('order123', 'confirmed');
     */
    static async updateOrderStatus(orderId, status) {
        try {
            const orderRef = doc(db, this.COLLECTIONS.ORDERS, orderId);
            await updateDoc(orderRef, {
                status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            throw new Error('Failed to update order status');
        }
    }
}

// Export Firebase instances for direct access if needed
export { app };
