# OM Yashoda Dairy - Website Documentation

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Firebase](https://img.shields.io/badge/Firebase-10.8.0-orange)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)

A modern, secure, and cost-effective dairy shop website with real-time WhatsApp notifications, Firebase authentication (Email + Google), and automated CI/CD deployment.

## 🌟 Features

- **Modern UI/UX**: Beautiful blue/white design with responsive layout
- **Multilingual Support**: Products in English, Hindi, and Marathi
- **User Authentication**: Firebase Auth with Email/Password + **Google Sign-In**
- **Shopping Cart**: Persistent cart with localStorage
- **Secure Checkout**: Form validation and user authentication required
- **Real-time Notifications**: **Twilio WhatsApp** notifications with email fallback
- **Email Confirmations**: Customer emails via Resend
- **Serverless Backend**: Vercel serverless functions
- **Database**: Firebase Firestore (migration-friendly architecture)
- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
- **Code Quality**: ESLint and Prettier for consistent code style
- **Semantic Versioning**: Automated version management and releases
- **Security**: Rate limiting, input sanitization, session management

## 📁 Project Structure

```
dairy-webapp/
├── api/                      # Serverless functions
│   └── submit-order.js       # Order processing & notifications
├── css/                      # Stylesheets
│   ├── variables.css         # Design tokens & CSS variables
│   ├── reset.css             # CSS reset
│   ├── global.css            # Global styles & utilities
│   ├── components.css        # Reusable components
│   └── pages.css             # Page-specific styles
├── js/                       # JavaScript modules
│   ├── config.js             # Application configuration
│   ├── firebase-config.js    # Firebase setup & services
│   ├── utils.js              # Utility functions (25+)
│   ├── products.js           # Product management
│   ├── cart.js               # Shopping cart logic
│   └── checkout.js           # Checkout processing
├── data/                     # Static data
│   └── products.json         # Product catalog
├── images/                   # Product images
│   └── products/             # Product photos
├── index.html                # Home page
├── products.html             # Product catalog
├── cart.html                 # Shopping cart
├── checkout.html             # Checkout with auth
├── confirmation.html         # Order confirmation
├── package.json              # Dependencies
├── vercel.json               # Vercel configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase account (free tier)
- Vercel account (free tier)
- CallMeBot setup (free)
- Resend account (optional, for emails)

### 1. Clone and Install

```bash
cd /Users/jayeshrajput/Documents/dairy-webapp
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: "om-yashoda-dairy"
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** → Start in production mode
5. Get your config from Project Settings → General → Your apps

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Shop Configuration
SHOP_OWNER_PHONE=+919320056114

# CallMeBot (WhatsApp Notifications)
CALLMEBOT_API_KEY=your_callmebot_key

# Resend (Email - Optional)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=orders@omyashodadairy.com
```

### 4. CallMeBot Setup (WhatsApp Notifications)

1. Add CallMeBot to WhatsApp: [+34 644 44 96 69](https://wa.me/34644449669)
2. Send message: `I allow callmebot to send me messages`
3. You'll receive your API key
4. Add API key to `.env`

**Note**: CallMeBot is completely free and works instantly!

### 5. Resend Setup (Email - Optional)

1. Sign up at [Resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify your domain (or use resend.dev for testing)
4. Add credentials to `.env`

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 7. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

## 🔐 Security Features

### Authentication
- Firebase Authentication with email/password
- Session management with automatic timeout
- Protected checkout (login required)

### Input Validation
- Client-side form validation
- Server-side sanitization
- Phone/email format validation
- XSS protection

### Rate Limiting
- 5 orders per hour per IP
- Prevents spam and abuse
- In-memory store (resets on cold start)

### Data Protection
- Environment variables for secrets
- HTTPS only in production
- Secure headers (CSP, HSTS, etc.)
- Input sanitization on all user data

## 📱 WhatsApp Notification Format

When a customer places an order, you'll receive:

```
🛒 NEW ORDER - OM Yashoda Dairy

Order ID: ORD-20260212-001
Time: 12/02/2026, 10:30 AM

Customer Details:
Name: Rajesh Kumar
Phone: +91 9876543210
Address: 123 Main Street, Kalyan West

Items:
• भैंस का घी (1kg) x 1 - ₹800
• गाय का दूध (1L) x 2 - ₹120

Total: ₹920

Delivery: Morning (7 AM - 10 AM)
Payment: Cash on Delivery
```

## 🗄️ Database Schema

### Users Collection (`users`)

```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  phone: string,
  address: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Orders Collection (`orders`)

```javascript
{
  orderId: string,          // ORD-YYYYMMDD-XXX
  userId: string,
  customer: {
    name: string,
    email: string,
    phone: string,
    address: string,
    landmark: string
  },
  items: [{
    productId: string,
    productName: string,
    productNameHindi: string,
    quantity: number,
    price: number,
    unit: string,
    subtotal: number
  }],
  deliverySlot: string,
  specialInstructions: string,
  paymentMethod: string,
  subtotal: number,
  deliveryCharge: number,
  total: number,
  status: string,           // pending, confirmed, delivered, cancelled
  createdAt: timestamp
}
```

## 🛠️ Maintenance Guide

### Updating Product Prices

Edit `/data/products.json`:

```json
{
  "id": "buffalo-ghee",
  "price": 850,  // Update price here
  ...
}
```

### Adding New Products

1. Add product to `/data/products.json`
2. Add product image to `/images/products/`
3. Image should be named `{product-id}.jpg`

### Updating Shop Details

Edit `/js/config.js`:

```javascript
export const CONFIG = {
  SHOP_NAME: 'OM Yashoda Dairy',
  SHOP_ADDRESS: 'Your new address',
  SHOP_PHONE: '+91 9320056114',
  ...
};
```

## 📊 Cost Breakdown

### Free Tier (₹0/month)
- Vercel hosting: Free
- Firebase Auth: Free (up to 10K users)
- Firebase Firestore: Free (50K reads, 20K writes/day)
- CallMeBot WhatsApp: Free (unlimited)
- Domain: ₹500-1000/year (optional)

### With Email (₹100-200/month)
- Resend: $20/month for 50K emails
- Everything else: Free

**Total: ₹10-20/month** (just domain cost!)

## 🔄 Migration Guide

The codebase uses a repository pattern for easy database migration:

### Current: Firebase Firestore

```javascript
import { DatabaseService } from './firebase-config.js';
await DatabaseService.createOrder(orderData);
```

### Migrating to MongoDB/PostgreSQL

1. Create new database service file
2. Implement same interface:
   - `createOrder(orderData)`
   - `getOrder(orderId)`
   - `updateUser(userId, data)`
3. Update import in modules
4. No other code changes needed!

## 🧪 Testing

### Manual Testing Checklist

- [ ] Home page loads correctly
- [ ] Products display with Hindi/Marathi names
- [ ] Search and filters work
- [ ] Add to cart functionality
- [ ] Cart persistence (refresh page)
- [ ] Login/Register flow
- [ ] Checkout form validation
- [ ] Order submission
- [ ] WhatsApp notification received
- [ ] Email confirmation received
- [ ] Order confirmation page

### Test Order

1. Browse products
2. Add items to cart
3. Go to checkout
4. Register/Login
5. Fill delivery details
6. Place order
7. Check WhatsApp for notification
8. Check email for confirmation

## 📞 Support & Contact

**Shop Owner**: +91 9320056114  
**Location**: Hari Om Krupa Society, Rambaugh Lane Number 4, Kalyan West, 421301, Maharashtra, India

## 📝 License

© 2026 OM Yashoda Dairy. All rights reserved.

---

## 🎯 Future Enhancements

### Phase 2 (Optional)
- [ ] Admin dashboard for order management
- [ ] Real-time order tracking
- [ ] Customer order history
- [ ] Subscription/recurring orders
- [ ] Online payment integration (Razorpay)
- [ ] SMS notifications
- [ ] Product reviews and ratings
- [ ] Loyalty program
- [ ] Analytics dashboard

### Scalability
- [ ] Migrate to Next.js for SSR
- [ ] Add Redis for caching
- [ ] Implement CDN for images
- [ ] Add search indexing (Algolia)
- [ ] Multi-location support

---

**Built with ❤️ for OM Yashoda Dairy**
