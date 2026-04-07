# Delivery App

A full-featured delivery application built with Next.js, featuring user authentication, cart functionality, payment processing, admin and agent portals, and live tracking.

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe
- **Mapping/Tracking**: Leaflet with React-Leaflet
- **Deployment**: Vercel

## Features

- **User Authentication**: Login and signup with Supabase Auth
- **Product Catalog**: Browse food items (pizzas, burgers, salads, pasta)
- **Shopping Cart**: Add items, update quantities, view cart
- **Checkout & Payments**: Secure payment processing with Stripe
- **Admin Portal**: Manage pending orders and assign deliveries
- **Delivery Agent Portal**: View assigned deliveries and update status
- **Live Tracking**: Real-time location tracking with Leaflet maps

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository and navigate to the project directory.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Go to SQL Editor and run the contents of `supabase-schema.sql`
   - Note your project URL and anon key

4. Set up Stripe:
   - Create a Stripe account
   - Get your publishable and secret keys from the dashboard

5. Create environment variables:
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

   > Important: placeholder Supabase values will cause the app to fail at runtime. Use your actual Supabase project URL and anon key. Do not put a Stripe publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Schema

The app uses the following tables:
- `products`: Product catalog
- `orders`: Customer orders
- `order_items`: Items in orders
- `deliveries`: Delivery assignments and tracking

Run `supabase-schema.sql` in your Supabase SQL Editor to set up the database.

## User Roles

- **Customer**: Can browse products, add to cart, place orders
- **Admin**: Can view and manage orders, assign deliveries
- **Agent**: Can view assigned deliveries, update status and location

Set user roles in Supabase Auth user metadata with key `role` and values `customer`, `admin`, or `agent`.

## API Routes

- `/api/products`: Get products
- `/api/orders`: Create/view orders
- `/api/payments`: Handle Stripe payments
- `/api/deliveries`: Manage deliveries

## Deployment

Deploy to Vercel by connecting your GitHub repository. Set environment variables in the Vercel dashboard.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
