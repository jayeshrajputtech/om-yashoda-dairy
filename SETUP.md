# Setup Guide - OM Yashoda Dairy Website

Complete setup guide for the OM Yashoda Dairy website with Firestore database and secure architecture.

---

## Prerequisites

- ✅ Node.js 18 or higher
- ✅ Google account (for Firebase)
- ✅ Vercel account (free tier)
- ✅ Git installed

---

## Step 1: Clone & Install

```bash
cd /Users/jayeshrajput/Documents/dairy-webapp
npm install
```

This installs:
- Firebase SDK (client + admin)
- Resend (email service)
- ESLint & Prettier (code quality)

---

## Step 2: Firebase Project Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `om-yashoda-dairy`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication

1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Enable **Google** provider
   - Add authorized domain: `localhost` (for testing)
   - Add authorized domain: `your-project.vercel.app` (for production)
5. Click "Save"

### 2.3 Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location: `asia-south1` (Mumbai)
5. Click "Enable"

### 2.4 Set Firestore Security Rules

Go to **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - Read-only (managed via API)
    match /products/{productId} {
      allow read: if true;
      allow write: if false; // Only via admin SDK
    }
    
    // Users - Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders - Users can create and read their own orders
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      allow update: if false; // Only via admin SDK
      allow delete: if false;
    }
  }
}
```

Click "Publish"

### 2.5 Get Firebase Configuration

1. Go to Project Settings (gear icon) → General
2. Scroll to "Your apps"
3. Click web icon `</>`
4. App nickname: `OM Yashoda Dairy Web`
5. Click "Register app"
6. Copy the configuration

### 2.6 Generate Service Account (for server-side)

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. **IMPORTANT**: Never commit this file to Git!

---

## Step 3: Environment Variables

### 3.1 Create .env File

```bash
cp .env.example .env
```

### 3.2 Add Firebase Configuration

```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=om-yashoda-dairy.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=om-yashoda-dairy
VITE_FIREBASE_STORAGE_BUCKET=om-yashoda-dairy.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin (Server-side)
# For local development, you can use the service account JSON
# For production, add this as a secret in Vercel/GitHub
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}' 

# Shop Configuration
SHOP_OWNER_PHONE=+919320056114
SHOP_OWNER_EMAIL=owner@omyashodadairy.com

# Email Notifications (Resend)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
RESEND_FROM_EMAIL=orders@omyashodadairy.com
```

---

## Step 4: Initialize Firestore with Products

### 4.1 Sync Products to Firestore

```bash
node scripts/sync-products.js
```

This reads `data/products.json` and populates the Firestore `products` collection.

You should see:

```
🔧 Initializing Firebase Admin...
✅ Firebase Admin initialized
📦 Loaded 12 products from JSON
➕ Added: Buffalo Ghee
➕ Added: Cow Ghee
...
✅ Product sync completed successfully!
```

### 4.2 Verify in Firebase Console

1. Go to Firestore Database
2. You should see `products` collection with 12 documents

---

## Step 5: Email Setup (Resend)

### 5.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free
3. Verify email

### 5.2 Get API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name: `OM Yashoda Dairy`
4. Copy the key

### 5.3 Add to .env

```env
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
RESEND_FROM_EMAIL=onboarding@resend.dev  # For testing
```

**Production**: Verify your domain in Resend to use custom email.

---

## Step 6: Test Locally

### 6.1 Start Development Server

```bash
npm run dev
```

This starts a simple Python HTTP server on port 3000.

### 6.2 Test with Vercel Functions

To test serverless functions locally:

```bash
npm run dev:vercel
```

### 6.3 Test the Website

1. Open `http://localhost:3000`
2. Browse products (loaded from Firestore via API)
3. Register with Google or Email/Password
4. Add items to cart
5. Place a test order
6. Check email for confirmation

### 6.4 Verify

- **Firestore**: Check `orders` collection for new order
- **Email**: Check inbox for confirmation
- **Console**: Check browser console for logs

---

## Step 7: Deploy to Vercel

### 7.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/om-yashoda-dairy.git
git push -u origin main
```

### 7.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Project name: `om-yashoda-dairy`
5. Framework Preset: Other
6. Click "Deploy"

### 7.3 Add Environment Variables

In Vercel → Settings → Environment Variables, add:

**All Firebase variables** (from .env)
**Resend API key**
**Shop configuration**
**Firebase Service Account** (as JSON string)

### 7.4 Redeploy

After adding environment variables, click "Redeploy" in Deployments tab.

---

## Step 8: Set Up GitHub Actions (CI/CD)

### 8.1 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VERCEL_TOKEN` (from Vercel → Settings → Tokens)
- `VERCEL_ORG_ID` (from `.vercel/project.json`)
- `VERCEL_PROJECT_ID` (from `.vercel/project.json`)
- `FIREBASE_SERVICE_ACCOUNT` (service account JSON)
- `VITE_FIREBASE_PROJECT_ID` (Firebase project ID)

### 8.2 Test CI/CD

1. Create a pull request
2. GitHub Actions will:
   - Run ESLint
   - Run Prettier
   - Run security scan
   - Deploy preview to Vercel

3. Merge to `main`
4. GitHub Actions will:
   - Deploy to production
   - Create GitHub release
   - Tag version

---

## Step 9: Product Management

### 9.1 Update Products

Edit `data/products.json`:

```json
{
  "id": "buffalo-ghee",
  "nameEnglish": "Buffalo Ghee",
  "nameHindi": "भैंस का घी",
  "nameMarathi": "म्हशीचे तूप",
  "price": 850,  // Update price
  "unit": "1kg",
  "category": "premium",
  "inStock": true,
  "featured": true,
  "image": "/images/products/buffalo-ghee.jpg"
}
```

### 9.2 Sync to Firestore

**Option 1: Manual Sync**
```bash
node scripts/sync-products.js
```

**Option 2: Automatic Sync (via GitHub)**
```bash
git add data/products.json
git commit -m "Update product prices"
git push
```

GitHub Action will automatically sync to Firestore!

---

## Step 10: WhatsApp Notifications (Optional - Twilio)

**Currently disabled**. To enable:

### 10.1 Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for free trial ($15 credit)
3. Verify phone number

### 10.2 Set Up WhatsApp Sandbox

1. Go to Messaging → Try it out → Send a WhatsApp message
2. Follow instructions to join sandbox
3. Get credentials:
   - Account SID
   - Auth Token
   - WhatsApp From number

### 10.3 Uncomment Twilio Code

In `api/submit-order.js`:
1. Uncomment Twilio import (line 2)
2. Uncomment Twilio configuration (lines 27-40)
3. Uncomment `sendWhatsAppNotification` function (lines 152-211)
4. Uncomment function call (line 421)

### 10.4 Add Environment Variables

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+919320056114
```

### 10.5 Redeploy

```bash
vercel --prod
```

---

## Troubleshooting

### Products Not Loading

1. Check `/api/products` endpoint: `https://your-site.vercel.app/api/products`
2. Verify Firestore has products: Run `node scripts/sync-products.js`
3. Check Firebase service account is configured in Vercel

### Authentication Errors

1. Verify Firebase config in `.env`
2. Check authorized domains in Firebase Console
3. Enable Email/Password and Google providers

### Orders Not Saving

1. Check Firestore security rules
2. Verify user is authenticated
3. Check browser console for errors

### Email Not Sending

1. Verify Resend API key
2. Check Resend dashboard for logs
3. For production, verify domain

### Deployment Fails

1. Check Node.js version (must be 18+)
2. Verify all environment variables in Vercel
3. Check build logs in Vercel dashboard

---

## Architecture Overview

```
Client (Browser)
    ↓
Firebase Auth (Google + Email)
    ↓
/api/products → Firestore (products)
/api/submit-order → Firestore (orders) + Email

GitHub → Actions → Firestore (product sync)
```

**Security:**
- ✅ Products stored server-side (Firestore)
- ✅ Prices validated server-side
- ✅ No sensitive data in client
- ✅ Rate limiting on orders
- ✅ Input sanitization

---

## Next Steps

- [ ] Add real product images
- [ ] Test complete order flow
- [ ] Set up custom domain
- [ ] Enable Twilio WhatsApp (optional)
- [ ] Monitor Firestore usage
- [ ] Share with customers!

---

## Documentation

- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [docs/architecture.md](docs/architecture.md) - System architecture
- [docs/database-schema.md](docs/database-schema.md) - Database schema

---

**Your dairy shop website is ready! 🎉**

**Live URL:** `https://om-yashoda-dairy.vercel.app`
