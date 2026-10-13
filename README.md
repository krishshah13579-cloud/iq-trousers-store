# IQ Trousers — Krish Clothing Co.

A menswear e-commerce platform dedicated to precision-engineered trousers across sizes **28 to 44**, built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **NextAuth.js**.

---

## 🌟 Store Configuration

### 🏷️ Brand & Collections
- **Store Name**: **IQ Trousers**
- **Parent Company**: **Krish Clothing Co.**
- **Headquarters**: `Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008`
- **Collections**:
  - **Casual Everyday** (`/products?category=casual-everyday`): Chinos, stretch selvedge denim, linen trousers, relaxed overshirts.
  - **Formal Wear** (`/products?category=formal-wear`): Italian wool blazers, crisp Oxford shirts, pleated dress trousers, double-breasted suits.
- **Sizes Available**: `28, 30, 32, 34, 36, 38, 40, 42, 44` (selectable per product with live validation).

### 🧭 Navigation Menu
1. **IQ Trousers** (Brand Logo / Home)
2. **Shop All** (`/products`)
3. **Size Guide** (`/size-guide`) — Comprehensive measurement conversion chart (Inches & CM).
4. **About Us** (`/about`) — Story, tailoring heritage, and philosophy.
5. **Contact Us** (`/contact`) — Client care desk and inquiry form.
6. **Login/Sign Up** (`/login`)
7. **Wishlist** (`/wishlist`) — Save favorite trousers with 1-click cart transfer.
8. **Cart** (`/cart`) — Bag management with size variant support and live coupon input.

### 📬 Footer & Newsletter System
- **Mandatory Subscription Form**:
  - First Name (`*`)
  - Last Name (`*`)
  - Email Address (`*`)
  - Subscribe to newsletter consent (`*`)
  - Submit Button
- **Instant Welcome Gift**: Submitting the form delivers an exclusive **10% Discount Code** (`WELCOME10`) directly to the subscriber's email inbox.
- **Footer Links**:
  - `Shop All`, `Size Guide`, `About Us`, `Contact Us`
  - `Instagram`, `Facebook`
  - `FAQ`, `Terms And Conditions`
  - Address: `Q-8, Samet Business Park, Near Parishkar - 2, Khokhra Circle, Maninagar, Ahmedabad - 380008`
  - Copyright: `Copyright 2026 by Krish Clothing Co.`

---

## 🚀 Quick Start

### Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Accounts & Test Credentials

### 🛡️ Admin Portal
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@store.com`
- **Password**: `admin123`
- *Features*: Live sales metrics, product catalog CRUD with size selector (28-44), order fulfillment status & tracking code updater, and discount manager.

### 👤 Customer Account
- **URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Email**: `john@example.com`
- **Password**: `user123`

### 🎟️ Sample Coupons
| Code | Type | Value | Min Order |
|---|---|---|---|
| **`WELCOME10`** | Percentage | 10% Off | $0 |
| **`FORMAL20`** | Percentage | 20% Off | $150 |
| **`SAVE20`** | Fixed Amount | $20 Off | $100 |
