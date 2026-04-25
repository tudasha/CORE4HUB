# SmartEnv

A minimalist, AI-first IoT Smart Home/Farm e-commerce & onboarding platform. Built with Next.js 15, Tailwind CSS v4, Prisma, PostgreSQL, and NextAuth v5.

## Quick Start

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by copying `.env.example` to `.env.local` and filling in the values (you need a PostgreSQL database like Neon.tech).
4. Apply the database schema and seed the products:
   ```bash
   npx prisma db push
   npm run seed
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Auth.js) v5
- **Animations**: Framer Motion

## Features

- **AI Hero Section**: Simulated AI product recommendation based on plain-language prompts.
- **Catalog & E-commerce**: View available products, filter by category, and add to cart.
- **Cart & Checkout**: Drawer cart with optimistic UI updates and server actions.
- **User Dashboard**: View active configuration, order history, and access tutorials.
