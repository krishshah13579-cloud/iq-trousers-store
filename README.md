# Modern E-Commerce Platform

A production-ready e-commerce web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **NextAuth.js**.

---

## 🌟 Key Features

### 🛍️ Storefront & Catalog
- **Minimalist, Modern Design**: Clean whitespace, subtle shadows, responsive layout.
- **Product Catalog**: Live search, category filtering, price range filter, and sorting (price high/low, newest, name).
- **Product Detail**: Multi-image gallery, real-time stock availability, quantity selector, and customer reviews.
- **Reviews & Ratings**: View existing verified ratings and submit new reviews directly on the product page.

### 🛒 Shopping Cart & Checkout
- **Client-side Cart State**: Persistent shopping cart with localStorage synchronization.
- **Coupon / Discount System**: Real-time discount code validation (Percentage or Fixed amount discounts).
- **Free Shipping Threshold**: Dynamic indicator for free shipping over $100.
- **Seamless Checkout**: Address collection and instant order placement with automatic stock decrements.

### 🔐 Authentication & Customer Dashboard
- **NextAuth.js Authentication**: Secure credentials-based authentication with bcrypt-hashed passwords.
- **Customer Order Tracking**: Real-time visual progress timeline (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`), tracking numbers, and itemized billing breakdown.

### ⚙️ Admin Management Dashboard
- **Analytics Overview**: Real-time revenue, total orders, product inventory count, and registered customer metrics.
- **Product Management**: Full CRUD operations — add new products, edit pricing and inventory, delete products.
- **Order Management**: View customer orders, update delivery status inline, and assign tracking numbers.
- **Discount Code Management**: Create coupons, configure expiration dates, usage limits, and toggle active status.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup & Seed
The application uses SQLite with Prisma for zero-configuration local setup.
```bash
# Push database schema
npx prisma db push

# Seed sample data (products, categories, reviews, coupons, demo accounts)
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts & Test Credentials

### 🛡️ Admin Account
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@store.com`
- **Password**: `admin123`

### 👤 Customer Account
- **URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Email**: `john@example.com`
- **Password**: `user123`

### 🎟️ Sample Discount Codes
| Code | Type | Value | Minimum Order |
|---|---|---|---|
| `WELCOME10` | Percentage | 10% Off | $50 |
| `SAVE20` | Fixed Amount | $20 Off | $100 |
| `SUMMER25` | Percentage | 25% Off | $75 |

---

## 📁 Project Architecture

```
ecommerce-store/
├── prisma/
│   ├── schema.prisma             # Database schema (User, Product, Order, Discount, etc.)
│   └── seed.ts                   # Initial seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login and Registration routes
│   │   ├── admin/                # Admin portal (Dashboard, Products, Orders, Discounts)
│   │   ├── api/                  # REST API endpoints (Auth, Products, Orders, Reviews, Discounts)
│   │   ├── cart/                 # Shopping Cart page
│   │   ├── checkout/             # Order checkout page
│   │   ├── orders/               # Customer order history & tracking
│   │   ├── products/             # Product catalog & product detail
│   │   ├── layout.tsx            # Global layout with responsive navbar & footer
│   │   └── page.tsx              # Storefront homepage
│   ├── components/
│   │   ├── layout/               # Navbar, Footer, Session/Cart Providers
│   │   └── products/             # ProductCard, Filters, Gallery, Review forms
│   ├── context/
│   │   └── CartContext.tsx       # Shopping cart context with localStorage
│   ├── lib/
│   │   ├── auth.ts               # NextAuth configuration
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── utils.ts              # Currency, slug, status styling utilities
│   └── types/
│       └── index.ts              # TypeScript type definitions
└── next.config.ts                # Next.js configuration
```
