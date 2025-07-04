# Remeslo Market (ioty.ro)

A Next.js + TypeScript marketplace for handcrafted goods, inspired by Etsy, focused on Romanian artisans. 

## Project Overview
- **Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Firebase (Firestore, Auth), Genkit AI, Radix UI, Lucide Icons
- **Design:** Warm, handcrafted style (see [docs/blueprint.md](docs/blueprint.md) for style guide)
- **Goal:** Connect makers (sellers) and buyers in a magical, story-driven marketplace.

## Features Implemented
- **Landing Page:** Hero, featured listings/shops, categories, seller call-to-action
- **Shop Creation:** Sellers can create a shop with avatar, banner, bio, etc.
- **Listing Creation:** Sellers can create new product listings with images, price, description, category, tags, and acknowledge a listing fee
- **Product Details:** Product page with images, description, price, stock, reviews, and seller info
- **Shop Page:** Shopfront with listings, about, and reviews tabs
- **Cart:** Add to cart UI, price/tax/shipping calculation (mocked, no checkout yet)
- **Review System:** Leave and view reviews for products and shops (UI, mock data)
- **Navigation:** Category navigation, seller onboarding, and more
- **Mock Data Types:** Centralized in `src/lib/mock-data-types.ts`
- **Firebase Integration:** Firestore and Auth setup (see `src/lib/firebase.ts`)
- **AI/Genkit:** Placeholder for future AI features
- **Blog:** Blog UI structure (no real content yet)
- **Product & Shop Data:** Product and shop data is now fetched from Firestore, not mock data.
- **Admin Dashboard:** If a user is an admin (see below), a prominent moderation button appears in their dashboard linking to `/admin/moderate-listings`.
- **Stripe Integration (in progress):** Stripe payments will be handled via a secure API route using Stripe test mode only. No real charges will be made. A new API route will be added for Stripe checkout sessions.
- **Messaging:** Buyers can send messages to sellers from product/shop pages. Messages are stored in Firestore (`users/{sellerId}/messages`). Sellers receive in-app notifications for new messages and can reply from their dashboard. Sellers can open messages, mark them as read, and reply in a threaded conversation.
- **Order Details & Receipts:** Buyers and sellers can view detailed order pages and download PDF receipts for each order from their order history or dashboard.
- **Shop Reviews & Ratings:** Buyers can leave reviews for shops after orders. Shop pages display average rating and all reviews.
- **Shop Policies & FAQ:** Sellers can set shop policies and FAQ in their dashboard. Buyers can view these on shop pages.

## Admin Features
- **Admin Status:** Admin status is determined by the `isAdmin` field in the Firestore `users` collection. If set to `true`, the user will see a prominent moderation button in their dashboard.
- **Moderation Panel:** Admins can access `/admin/moderate-listings` to approve or reject listings. The moderation button is only visible to admin users in their dashboard.

## Not Yet Implemented / TODO
- [ ] **Stripe Integration:** Payment and checkout flow (UI mentions Stripe, but no backend integration yet)
- [ ] **Order Management:** Buyer order history, seller order dashboard
- [ ] **Favorites:** Like/favorite shops and products
- [ ] **Real Data:** Replace mock data with Firestore queries throughout (in progress)
- [ ] **Admin Panel:** Approve/reject listings, manage users/shops
- [ ] **Notifications:** Email or in-app notifications for orders/messages
- [ ] **Shop/Listing Promotion:** Paid advertising options for sellers
- [ ] **Mobile Responsiveness:** Audit and polish for all breakpoints
- [ ] **Accessibility:** Audit and improve a11y
- [ ] **Blog Content:** Add real blog categories and articles
- [ ] **Testing:** Add unit/integration tests
- [ ] **Docs:** Expand developer and user documentation

## Local Development
1. `npm install`
2. `npm run dev` (Next.js on port 9002)
3. Configure Firebase if needed (see `src/lib/firebase.ts`)

## References
- [docs/blueprint.md](docs/blueprint.md) — Core features & style guide
- [src/lib/mock-data-types.ts](src/lib/mock-data-types.ts) — Data models

## Usage
### Messaging
To send a message to a seller, use the "Contactează meșterul" button on a product or shop page. Sellers can view and reply to messages from their dashboard under "Mesaje".

### Seller Messaging
Sellers can open messages in their dashboard, which marks them as read, and reply directly in a threaded conversation.

### Order Details & Receipts
Buyers can click on any order in their order history to view full details and download a PDF receipt. Sellers can do the same from their dashboard for each order they have received.

### Shop Reviews & Ratings
After completing an order, buyers can leave a review and rating for the shop. Shop pages display the average rating and all reviews from buyers.

### Shop Policies & FAQ
Sellers can set shop policies (returns, shipping, etc.) and FAQ in their dashboard. These are displayed on the shop page for buyers.

---

*This project is in early development. See TODOs above for next steps!*
