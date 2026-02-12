# Changelog

All notable changes to the OM Yashoda Dairy website will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-12

### Added
- Initial release of OM Yashoda Dairy website
- Firebase Authentication (Email/Password + Google Sign-In)
- Shopping cart with localStorage persistence
- Product catalog with 12 dairy products
- Multilingual support (English, Hindi, Marathi)
- Twilio WhatsApp notifications for new orders
- Email confirmations via Resend
- Serverless order processing API
- Rate limiting (5 orders/hour per IP)
- Input validation and sanitization
- Responsive design with blue/white theme
- Vercel deployment configuration
- GitHub Actions CI/CD pipeline
- ESLint and Prettier for code quality
- Semantic versioning workflow

### Security
- Firebase security rules for Firestore
- XSS protection through input sanitization
- HTTPS-only in production
- Secure headers (CSP, HSTS, X-Frame-Options)
- Environment variable protection

## [Unreleased]

### Planned
- Admin dashboard for order management
- Customer order history
- Online payment integration (Razorpay)
- SMS notifications
- Product reviews and ratings
- Subscription/recurring orders
