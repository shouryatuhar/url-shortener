# URL Shortener

A clean, minimalist URL shortener built with Express and PostgreSQL, featuring instant client-side QR code generation and real-time click analytics.

---

## Features

- **Fast Shortening**: Generates compact, collision-resistant short codes using `nanoid`.
- **Custom Aliases**: Option to define custom link slugs (e.g. `/my-project`).
- **Instant QR Code Generation**: Generates QR codes directly in the browser with high-resolution PNG download.
- **Real-Time Click Analytics**: Tracks every redirect and view accurately with cache-controlled redirects.
- **Link Expiration**: Optional expiration date and time for time-sensitive links.
- **Recent Links History**: Stores recently generated links locally with quick copy and QR inspection.
- **Keyboard Shortcuts**: Press `⌘ + Enter` (or `Ctrl + Enter`) to shorten instantly.

---

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), standalone client-side QR library
- **Backend**: Node.js, Express 5, `nanoid`
- **Database**: PostgreSQL with `pg` connection pooling

---

## API Reference

### 1. Shorten URL
`POST /shorten`

**Request Body:**
```json
{
  "longUrl": "https://example.com/very/long/url",
  "customAlias": "my-alias",          // optional
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

Redirects with HTTP `302 Found` to the destination URL and increments the click counter in the database.

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

## Local Development

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

Open `http://localhost:3000` in your browser.
