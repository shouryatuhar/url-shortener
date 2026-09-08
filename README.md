# smolurl 🤏

> A minimalist, tracker-free URL shortener with real design thought — styled after Notion's iconic aesthetic. Built with Express, PostgreSQL, client-side QR generation, and live click tracking.

[![Live Demo](https://img.shields.io/badge/Live_Demo-smolurl-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://url-shortener-blush-one.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo

👉 **[url-shortener-blush-one.vercel.app](https://url-shortener-blush-one.vercel.app)**

---

## ✨ Features

- **🎨 Notion-Inspired Design**: Pure light-theme aesthetic using warm grays, crisp system typography, callout blocks (`💡`), expandable property lists (`▸`), and zero generic AI purple gradients.
- **⚡️ Fast Shortening**: Compact 7-character collision-resistant aliases via `nanoid`.
- **🏷 Custom Aliases**: Choose your own custom slug for branded links (e.g. `/my-project`).
- **📱 Instant QR Code Engine**: Standalone zero-network client-side QR generator with high-resolution PNG download.
- **👁 Real-Time Click Analytics**: Live auto-polling and cache-busting redirects (`no-cache`) so every click is accurately recorded in PostgreSQL.
- **⏱ Link Expiration**: Optional expiration date and time picker for temporary links.
- **📋 Database View**: Notion-styled table of your recently created links saved in `localStorage`, featuring 1-click clipboard copy, QR code modal, and a live `↻ Refresh stats` button.
- **⌨️ Keyboard Shortcut**: Press `⌘ + Enter` (or `Ctrl + Enter`) to shorten instantly.

---

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS3 (Notion design tokens), Vanilla JS (ES6+), Standalone QR engine
- **Backend**: Node.js, Express 5, `nanoid`
- **Database**: PostgreSQL (Neon Serverless Postgres) with `pg` connection pooling
- **Hosting**: Vercel Serverless Functions

---

## 🔌 API Reference

### 1. Shorten URL
`POST /shorten`

**Request Body:**
```json
{
  "longUrl": "https://example.com/very/long/url",
  "customAlias": "my-alias",      // optional
  "expiresAt": "2026-12-31T23:59:59Z" // optional ISO timestamp
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "short_code": "my-alias",
  "long_url": "https://example.com/very/long/url",
  "created_at": "2026-09-08T17:33:50.688Z",
  "expires_at": null,
  "clicks": 0
}
```

### 2. Redirect to Original URL
`GET /:code`

Redirects with HTTP `302 Found` to the original long URL and increments the click counter in PostgreSQL.

### 3. Click Analytics
`GET /:code/stats`

**Response (`200 OK`):**
```json
{
  "shortCode": "my-alias",
  "longUrl": "https://example.com/very/long/url",
  "createdAt": "2026-09-08T17:33:50.688Z",
  "expiresAt": null,
  "clicks": 14
}
```

---

## 💻 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/shouryatuhar/url-shortener.git
cd url-shortener
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL=postgresql://localhost:5432/url_shortener
```

Run the database schema migration:
```bash
psql url_shortener < db/schema.sql
```

### 4. Start the server
```bash
npm start
```

Open [`http://localhost:3000`](http://localhost:3000) in your browser.

---

## 🚀 Deployment

The project is pre-configured for zero-config deployment on **Vercel** with **Neon Postgres**:

1. Link and deploy to Vercel:
   ```bash
   vercel --prod
   ```
2. Add Neon Serverless Postgres:
   ```bash
   vercel integration add neon --plan free_v3 --name smolurl-db
   ```
3. Run `db/schema.sql` on the database to create the `urls` table.

---

## 📄 License

This project is licensed under the ISC License.
