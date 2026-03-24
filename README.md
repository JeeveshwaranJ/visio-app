# VISIO — AI Vision Assistant

> An AI-powered image analysis tool built with **Node.js**, **Express**, and **Azure OpenAI GPT-4o Mini**. Upload any image and get instant AI-generated descriptions, text extraction, object detection, captions, and more — all through a clean browser interface.

---

## What It Does

VISIO lets you upload an image and ask AI to analyze it in different ways:

| Mode | What it does |
|---|---|
| **Describe** | Gives a full natural language description of the image |
| **Extract Text** | Reads and transcribes any text visible in the image (OCR) |
| **Detect Objects** | Lists every object, person, or element it can identify |
| **Deep Analysis** | Covers composition, colors, style, quality, and insights |
| **Caption** | Writes ready-to-use captions for Instagram, LinkedIn, and news |
| **Custom** | You write your own question or instruction |

---

## How It Works

The browser never talks to Azure directly — your API key stays safe on the server.

```
Browser  →  Express Server (your machine)  →  Azure OpenAI API
              ↑ holds the API key                ↑ GPT-4o Mini vision
```

1. You upload an image and choose an analysis mode in the browser
2. The browser sends the image + prompt to your local Express server
3. The Express server forwards it securely to Azure OpenAI using your API key
4. Azure returns the AI response, which the server sends back to the browser
5. The result appears in the interface

---

## Prerequisites

Before you start, make sure you have:

- [Node.js](https://nodejs.org/) version 18 or higher — check with `node -v`
- An **Azure account** with an OpenAI resource created
- A **GPT-4o Mini deployment** set up in Azure AI Studio with vision enabled

---

## Project Structure

```
visio-app/
├── public/
│   └── index.html        ← The entire frontend (HTML + CSS + JS in one file)
├── server.js             ← Express server: serves frontend + proxies Azure API calls
├── package.json          ← Project config, dependencies, and npm scripts
├── .env.example          ← Template for your environment variables (safe to commit)
├── .env                  ← Your actual secrets — NEVER commit this file
├── .gitignore            ← Tells git to ignore .env and node_modules
└── README.md             ← This file
```

---

## Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/visio-app.git
cd visio-app
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs three packages: `express` (web server), `cors` (cross-origin requests), and `dotenv` (loads `.env` file). `nodemon` is also installed as a dev tool that auto-restarts the server when you change files.

### Step 3 — Set up your environment variables

Copy the example file and fill in your Azure credentials:

```bash
# Mac / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Then open `.env` in any text editor and fill in your values:

```env
AZURE_OPENAI_API_KEY=your-azure-api-key-here
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_API_VERSION=2024-04-01-preview
PORT=3000
ALLOWED_ORIGIN=*
```

**Where to find these values:**

| Variable | Where to find it |
|---|---|
| `AZURE_OPENAI_API_KEY` | Azure Portal → your OpenAI resource → **Keys and Endpoint** → Key 1 |
| `AZURE_OPENAI_ENDPOINT` | Same page → **Endpoint** (looks like `https://xxx.openai.azure.com`) |
| `AZURE_OPENAI_DEPLOYMENT` | [Azure AI Studio](https://oai.azure.com) → **Deployments** → your deployment name |
| `AZURE_API_VERSION` | Leave as-is (`2024-04-01-preview` supports vision) |
| `PORT` | The port your server runs on. Change if 3000 is already in use |
| `ALLOWED_ORIGIN` | Leave as `*` for local dev. Set to your domain in production |

### Step 4 — Start the server

```bash
# Development mode — auto-restarts when you edit server.js or .env
npm run dev

# Production mode — starts once, no auto-restart
npm start
```

You should see:

```
✅  VISIO running → http://localhost:3000
   Azure deployment : gpt-4o-mini
   Endpoint         : https://your-resource.openai.azure.com
```

### Step 5 — Open the app

Go to **http://localhost:3000** in your browser. Upload an image, pick a mode, and click **Analyze Image**.

---

## Common Issues

**`EADDRINUSE: address already in use :::3000`**
Something else is already running on port 3000. Either stop that process or change `PORT=3001` in your `.env` file, then restart.

On Windows, to find and kill the process using port 3000:
```cmd
netstat -ano | findstr :3000
taskkill /PID <the number shown> /F
```

**`Missing Azure config`**
Your `.env` file is missing or one of the three required variables is empty. Double-check that `.env` exists (not just `.env.example`) and all values are filled in.

**`Azure API error: 404`**
Your deployment name is wrong. Go to Azure AI Studio → Deployments and copy the exact deployment name into `AZURE_OPENAI_DEPLOYMENT` in your `.env`.

**`Azure API error: 401`**
Your API key is invalid or expired. Get a fresh key from Azure Portal → your OpenAI resource → Keys and Endpoint.

---

## API Reference

The server exposes two endpoints:

### `POST /api/analyze`

Sends an image and prompt to Azure OpenAI and returns the AI response.

**Request body:**
```json
{
  "imageBase64": "<base64-encoded image string>",
  "mediaType": "image/jpeg",
  "prompt": "Describe this image in detail."
}
```

**Supported media types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Response:**
```json
{
  "result": "The image shows a sunset over the ocean...",
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 512,
    "completion_tokens": 128,
    "total_tokens": 640
  }
}
```

**Error response:**
```json
{
  "error": "Human-readable error message"
}
```

### `GET /health`

Returns server status. Useful for checking if the server is running and which Azure deployment is active.

**Response:**
```json
{
  "status": "ok",
  "deployment": "gpt-4o-mini"
}
```

---

## Rate Limiting

The server limits each IP address to **20 requests per minute** to protect against accidental overuse of your Azure quota. If you exceed this, you'll get a `429 Too Many Requests` response and can retry after a minute.

---

## Deploying to Production

You can deploy this to any Node.js hosting platform. No build step is needed.

**Recommended platforms:** [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)

Steps:
1. Push your code to GitHub (without `.env`)
2. Create a new project on your chosen platform and connect your GitHub repo
3. Add your environment variables in the platform's dashboard (same keys as your `.env`)
4. Deploy — the platform runs `npm start` automatically

**Before going live, update these in your environment:**
```env
ALLOWED_ORIGIN=https://your-actual-domain.com
```

---

## Security Notes

- `.env` is listed in `.gitignore` and will never be committed to git
- Your Azure API key only lives on the server — it is never sent to the browser
- The `ALLOWED_ORIGIN` variable restricts which domains can call your API (set it in production)
- Rate limiting prevents runaway usage of your Azure quota

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (single file) |
| Backend | Node.js + Express |
| AI | Azure OpenAI — GPT-4o Mini (vision) |
| Dev tooling | nodemon (auto-restart), dotenv (env vars) |

---

## License

MIT — free to use, modify, and distribute.
