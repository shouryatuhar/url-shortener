# Free-Tier Live Deployment Guide for smolurl

This guide explains how to host **smolurl** completely free using **Neon** (serverless PostgreSQL with generous free tier) and **Render** (free web service hosting).

---

## 1. Set Up Free PostgreSQL on Neon (2 minutes)

1. Go to [neon.tech](https://neon.tech) and sign up for a free account.
2. Click **New Project** and name it `smolurl`.
3. In the project dashboard, click on **SQL Editor** in the left sidebar.
4. Copy and paste the schema SQL from [`db/schema.sql`](file:///Users/shouryatuhar/Desktop/url-shortener/db/schema.sql):
   ```sql
   CREATE TABLE urls (
     id SERIAL PRIMARY KEY,
     short_code VARCHAR(20) UNIQUE NOT NULL,
     long_url TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     expires_at TIMESTAMP,
     clicks INTEGER DEFAULT 0
   );
   ```
5. Click **Run** to execute the table creation.
6. Return to the **Dashboard**, scroll to **Connection Details**, and copy the **Connection string** (looks like `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).

---

## 2. Deploy Web Service to Render (Free Tier)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Add smolurl Notion frontend and deployment config"
   git push origin main
   ```
2. Go to [render.com](https://render.com) and log in (or create an account).
3. Click **New +** > **Web Service**.
4. Select your `url-shortener` GitHub repository.
5. Fill in the service configuration:
   - **Name**: `smolurl` (or your choice)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = paste the Neon connection string from Step 1.
7. Click **Deploy Web Service**.

Render will automatically install dependencies, build, and deploy. In about 1–2 minutes, your live URL (e.g. `https://smolurl.onrender.com`) will be active!

---

## Alternative: Railway or Supabase

- **Supabase**: Can also be used for free hosted PostgreSQL. Run `schema.sql` in the Supabase SQL Editor and copy the URI under Project Settings > Database.
- **Railway**: Connect your repo and add a PostgreSQL plugin directly from their dashboard.
