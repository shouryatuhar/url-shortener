# smolurl

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
