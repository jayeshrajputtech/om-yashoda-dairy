# Deployment Guide - OM Yashoda Dairy

Complete guide for deploying the OM Yashoda Dairy website to production.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Firebase project set up
- Twilio account (optional, for WhatsApp)
- Resend account (optional, for emails)

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `om-yashoda-dairy`
3. Description: "Modern dairy shop website with Firebase auth and real-time notifications"
4. Visibility: Public or Private
5. Click "Create repository"

### 1.2 Push Code

```bash
cd /Users/jayeshrajput/Documents/dairy-webapp

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - v1.0.0"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/om-yashoda-dairy.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Vercel

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Project name: `om-yashoda-dairy`
5. Framework Preset: Other
6. Click "Deploy"

### 2.2 Add Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

**Firebase Configuration:**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Twilio (WhatsApp):**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+919320056114
```

**Resend (Email):**
```
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=orders@omyashodadairy.com
```

**Shop Configuration:**
```
SHOP_OWNER_PHONE=+919320056114
SHOP_OWNER_EMAIL=owner@omyashodadairy.com
```

### 2.3 Redeploy

After adding environment variables, click "Redeploy" in the Deployments tab.

---

## Step 3: Configure Firebase

### 3.1 Enable Google Authentication

1. Go to Firebase Console → Authentication
2. Click "Sign-in method"
3. Enable "Google"
4. Add authorized domain: `your-project.vercel.app`
5. Save

### 3.2 Update Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Step 4: Set Up GitHub Actions

### 4.1 Get Vercel Tokens

1. Go to Vercel → Account Settings → Tokens -> Create Token
2. Create new token: "GitHub Actions"
3. Copy the token

### 4.2 Get Vercel Project IDs

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Get project ID and org ID from .vercel/project.json
cat .vercel/project.json
```

### 4.3 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VERCEL_TOKEN`: Your Vercel token
- `VERCEL_ORG_ID`: From .vercel/project.json
- `VERCEL_PROJECT_ID`: From .vercel/project.json

---

## Step 5: Test Deployment

### 5.1 Test Locally

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Test in browser
open http://localhost:3000
```

### 5.2 Test Production

1. Visit your Vercel URL: `https://om-yashoda-dairy.vercel.app`
2. Test user registration
3. Test Google Sign-In
4. Place a test order
5. Verify WhatsApp notification
6. Verify email confirmation

---

## Step 6: Custom Domain (Optional)

### 6.1 Buy Domain

Buy domain from:
- GoDaddy
- Namecheap
- Google Domains

Recommended: `omyashodadairy.com`

### 6.2 Add to Vercel

1. Vercel → Settings → Domains
2. Add domain: `omyashodadairy.com`
3. Follow DNS configuration instructions
4. Add these DNS records:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 Update Firebase

Add custom domain to Firebase:
1. Firebase → Authentication → Settings
2. Authorized domains → Add domain
3. Add: `omyashodadairy.com`

---

## Step 7: Monitoring & Maintenance

### 7.1 Monitor Deployments

- Vercel Dashboard → Deployments
- Check for errors in Function Logs
- Monitor response times

### 7.2 Update Product Prices

```bash
# Edit products
vim data/products.json

# Commit and push
git add data/products.json
git commit -m "Update product prices"
git push

# Auto-deploys via GitHub Actions
```

### 7.3 Release New Version

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm run release:patch

# For new features (1.0.0 → 1.1.0)
npm run release:minor

# For breaking changes (1.0.0 → 2.0.0)
npm run release:major
```

---

## Troubleshooting

### Deployment Fails

1. Check Vercel build logs
2. Verify all environment variables are set
3. Check Node.js version (must be 18+)

### WhatsApp Not Working

1. Verify Twilio credentials
2. Check Twilio sandbox status
3. Review Function logs in Vercel

### Google Sign-In Fails

1. Check Firebase authorized domains
2. Verify Firebase API key
3. Check browser console for errors

### Orders Not Saving

1. Check Firestore rules
2. Verify Firebase configuration
3. Check browser console for errors

---

## Rollback Procedure

If deployment has issues:

1. Go to Vercel → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

Or via CLI:
```bash
vercel rollback
```

---

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] Firebase security rules configured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Rate limiting active in API
- [ ] Input validation working
- [ ] No sensitive data in client code

---

## Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Monitor Core Web Vitals
- [ ] Optimize images (use WebP format)
- [ ] Enable caching headers
- [ ] Monitor API response times

---

## Support

For issues:
1. Check Vercel deployment logs
2. Review Firebase console
3. Check GitHub Actions logs
4. Review browser console errors

**Your website is now live! 🎉**

Access at: `https://om-yashoda-dairy.vercel.app`
