// VISIO — Azure OpenAI Vision Proxy + Static Server
// Serves the frontend from /public and proxies vision requests to Azure

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Azure OpenAI config ─────────────────────────────────────────────────────
const AZURE_API_KEY     = process.env.AZURE_OPENAI_API_KEY;
const AZURE_ENDPOINT    = process.env.AZURE_OPENAI_ENDPOINT;    // https://YOUR-RESOURCE.openai.azure.com
const AZURE_DEPLOYMENT  = process.env.AZURE_OPENAI_DEPLOYMENT;  // gpt-4o-mini
const AZURE_API_VERSION = process.env.AZURE_API_VERSION || "2024-04-01-preview";

if (!AZURE_API_KEY || !AZURE_ENDPOINT || !AZURE_DEPLOYMENT) {
  console.error("❌  Missing Azure config. Rename .env.example to .env and fill in your values.");
  process.exit(1);
}

const AZURE_URL =
  `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "25mb" }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));

// Serve frontend from /public
app.use(express.static(join(__dirname, "public")));

// ── Rate limiting (in-memory, per IP) ──────────────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT     = 20;
const RATE_WINDOW_MS = 60_000;

function rateLimit(req, res, next) {
  const ip  = req.ip;
  const now = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, start: now });
    return next();
  }
  if (entry.count >= RATE_LIMIT) {
    return res.status(429).json({ error: "Too many requests — try again in a minute." });
  }
  entry.count++;
  requestCounts.set(ip, entry);
  next();
}

// ── POST /api/analyze ───────────────────────────────────────────────────────
app.post("/api/analyze", rateLimit, async (req, res) => {
  const { imageBase64, mediaType, prompt } = req.body;

  if (!imageBase64 || !prompt) {
    return res.status(400).json({ error: "imageBase64 and prompt are required." });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(mediaType)) {
    return res.status(400).json({ error: "Unsupported image type." });
  }

  const dataUrl = `data:${mediaType};base64,${imageBase64}`;

  try {
    const azureRes = await fetch(AZURE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await azureRes.json();

    if (!azureRes.ok) {
      console.error("Azure API error:", data);
      return res.status(azureRes.status).json({
        error: data?.error?.message || "Azure API error",
      });
    }

    const text = data.choices?.[0]?.message?.content || "";
    res.json({ result: text, model: data.model, usage: data.usage });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ── GET /health ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", deployment: AZURE_DEPLOYMENT })
);

// Fallback: serve index.html for any unmatched route
app.get("*", (_req, res) =>
  res.sendFile(join(__dirname, "public", "index.html"))
);

app.listen(PORT, () => {
  console.log(`\n✅  VISIO running → http://localhost:${PORT}`);
  console.log(`   Azure deployment : ${AZURE_DEPLOYMENT}`);
  console.log(`   Endpoint         : ${AZURE_ENDPOINT}\n`);
});
