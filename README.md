# 💎 Gemsutopia

A premium gemstone e-commerce website built with Next.js, featuring hand-picked gems from Alberta, Canada.

## 🌟 Overview

Gemsutopia is a modern, responsive e-commerce platform specializing in ethically sourced gemstones. Built by Reese, a passionate gem dealer based in Alberta, Canada, the site showcases premium gemstones with a focus on quality, authenticity, and customer experience.

**This is a real storefront** - A genuine business selling authentic gemstones with plans for full e-commerce functionality.

## ✨ Features

### 🎨 Frontend & UX (Complete)
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Hero Slider** - Auto-rotating image carousel (15s intervals)
- **Product Showcase** - Featured gems with wishlist and cart functionality
- **Interactive Shopping** - Wishlist (star icon) and Gem Pouch (shopping cart)
- **Professional Pages** - About, Contact, Support, Shop with full content
- **Legal Compliance** - Terms of Service, Privacy Policy, Cookie Policy, Returns & Exchange
- **Cookie Management** - GDPR-compliant cookie consent system with granular controls

### 🛒 E-commerce Features (Frontend Ready)
- **Product Grid** - Shop page with 16 products, filtering, and sorting
- **Wishlist System** - Add/remove favorites with persistent storage
- **Shopping Cart** - Gem Pouch with item management
- **Product Pages** - Individual product detail pages
- **Visual Feedback** - Icons change state when items added/removed

### 🎨 Design System
- **Color Scheme** - Professional black and white with accent colors
- **Typography** - Clean, modern fonts with proper hierarchy
- **Icons** - Lucide React icons for consistency
- **Components** - Reusable Header, Footer, Product Cards
- **Animations** - Smooth transitions and hover effects

### 📱 User Experience
- **Newsletter Signup** - Footer email subscription (ready for Mailchimp)
- **Contact Form** - EmailJS integration ready
- **Support Center** - FAQ, email support, response time info
- **Social Media** - Instagram, Twitter, Facebook links

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React, Font Awesome, Web3 Icons
- **State Management:** React Context (Wishlist, Cart, Cookies, Wallet)
- **Storage:** localStorage for persistence
- **Email:** EmailJS (ready to configure)
- **Blockchain:** Solana Web3.js, Ethers.js
- **Crypto APIs:** CoinGecko (live pricing)
- **Database:** Supabase (orders, users, admin)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── about/             # About page
│   ├── contact-us/        # Contact form
│   ├── shop/              # Product catalog
│   ├── support/           # Support center
│   ├── cookie-settings/   # Cookie preferences
│   └── [legal pages]/     # Terms, Privacy, etc.
├── components/            # Reusable components
│   ├── Header.tsx         # Navigation
│   ├── Footer.tsx         # Footer with links
│   ├── Hero.tsx           # Image carousel
│   ├── Products.tsx       # Product grid
│   ├── About.tsx          # About section
│   └── CookieBanner.tsx   # Cookie consent
├── contexts/              # Global state
│   ├── GemPouchContext.tsx    # Shopping cart
│   ├── WishlistContext.tsx    # Wishlist
│   └── CookieContext.tsx      # Cookie preferences
└── public/images/         # Product images
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd gemsutopia

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the site.

## 📧 Contact Configuration

The contact form is ready for EmailJS integration:
- Form component: `src/app/contact-us/page.tsx`
- Email address: `gemsutopia@gmail.com`
- EmailJS package installed and configured

## 🍪 Cookie System

Professional GDPR-compliant cookie management:
- **Cookie Banner** - Appears on first visit
- **Granular Controls** - Essential, Analytics, Marketing, Functional
- **Persistent Storage** - Remembers user preferences
- **Analytics Ready** - Google Analytics integration prepared

## 🎯 Current Status

### ✅ Completed (90%)
- ✅ **Frontend Design** - Complete responsive UI/UX
- ✅ **Product Catalog** - Shop page with filtering/sorting
- ✅ **User Interactions** - Wishlist and cart functionality  
- ✅ **Content Pages** - All legal and informational pages
- ✅ **Cookie System** - Full GDPR compliance
- ✅ **Contact Form** - EmailJS integration ready
- ✅ **Professional Polish** - Production-ready frontend

### 🔄 In Progress (10%)
- 🔄 **EmailJS Setup** - Contact form email delivery
- 🔄 **Analytics Setup** - Google Analytics integration
- 🔄 **Newsletter Setup** - Mailchimp integration

### ✅ Recently Added (Security & Admin)
- ✅ **Ultra-Secure Admin Panel** - 6-layer security system
- ✅ **Content Management** - JSON-based CMS with GitHub auto-commits
- ✅ **Rate Limiting** - 5 failed attempts = 15min IP ban
- ✅ **Two-Factor Authentication** - Email verification codes
- ✅ **Login Notifications** - Real-time security alerts
- ✅ **Session Management** - Advanced session security
- ✅ **IP Allowlisting** - Optional maximum security mode

### 💰 Cryptocurrency Payments (New!)
- ✅ **Multi-Wallet Support** - Works with any compatible wallet
- ✅ **Solana Payments** - Real devnet transactions (Phantom, Solflare, Backpack)
- ✅ **Ethereum Payments** - Real Sepolia testnet transactions (MetaMask, Coinbase, Trust)
- ✅ **Live Pricing** - Real-time crypto prices via CoinGecko API
- ✅ **Admin Dashboard** - Complete order tracking with blockchain explorer links
- ✅ **Smart Balance Checking** - Prevents failed transactions
- ✅ **Multi-Currency Support** - USD, CAD, SOL, ETH, BTC display
- 🔄 **Bitcoin Payments** - Planned (Unisat, Xverse, Leather wallet support)

### 🔄 Traditional Payments (Planned)
- 🔄 **Stripe Integration** - Credit card processing
- 🔄 **PayPal Integration** - PayPal checkout
- 🔄 **Apple/Google Pay** - Mobile payment methods

### ❌ Not Started (Additional Features)
- ❌ **User Authentication** - Account system (customer-facing)
- ❌ **Order Fulfillment** - Shipping and tracking
- ❌ **Email Automation** - Order confirmations, shipping notifications
- ❌ **Inventory Management** - Stock tracking and updates

## 🎨 Brand Identity

**About Gemsutopia:**
- Founded by Reese, based in Alberta, Canada
- Hand-mined, ethically sourced gemstones
- Focus on quality, integrity, and personal service
- Many gems personally mined by the founder
- Orders packed with care by Reese and spouse
- Small business with big dreams

## 📱 Responsive Design

- **Mobile First** - Optimized for all screen sizes
- **Touch Friendly** - Swipe gestures and touch interactions
- **Fast Loading** - Optimized images and code splitting
- **Accessibility** - Semantic HTML and ARIA labels

## 🔒 Security & Compliance

### 🛡️ Admin Panel Security (Ultra-Secure)
**6-Layer Security System:**
1. **IP Allowlisting** - Optional whitelist mode (disabled by default)
2. **Rate Limiting** - 5 failed attempts = 15min IP ban
3. **hCaptcha** - Bot protection on login
4. **Strong Authentication** - Email + secure passcode
5. **Suspicious Login Detection** - Blocks known attack patterns
6. **Two-Factor Authentication** - Email verification codes

**Additional Security Features:**
- **Session Hijacking Protection** - Detects IP/browser changes
- **Auto-logout** - 30min inactivity timeout
- **Real-time Notifications** - Email alerts for all login attempts
- **Emergency Access** - Can add current IP if locked out

### 🔑 Admin Access Setup
**Authorized Users:**
- `wilson.asher00@gmail.com` - Site administrator
- `reeseroberge10@gmail.com` - Business owner
- `gemsutopia@gmail.com` - Business account

**⚠️ IMPORTANT: Add Reese's IP to allowlist for maximum security**
- Get Reese's IP address: https://whatismyipaddress.com/
- Add to `.env.local`: `ADMIN_ALLOWED_IPS=his.ip.address.here`
- Or leave empty to disable IP restrictions

### 🔐 Customer Site Security
- **GDPR Compliant** - Cookie consent and privacy controls
- **Legal Pages** - Complete terms, privacy, and policies
- **Secure Forms** - Proper validation and sanitization
- **Cookie Management** - Granular privacy controls

## 📈 Performance

- **Next.js Optimizations** - Image optimization, code splitting
- **Tailwind CSS** - Utility-first styling for smaller bundles
- **Component Efficiency** - Optimized React patterns
- **Lazy Loading** - Images and components load on demand

## 🤝 Contact

For business inquiries: `gemsutopia@gmail.com`

## 📄 License

Private commercial project. All rights reserved.

---

**Built with ❤️ for the gem community by Reese @ Gemsutopia**