# VISIO — AI Vision Assistant

Powered by Azure OpenAI GPT-4o Mini vision.

## Project structure

```
visio-app/
├── public/
│   └── index.html       # Frontend (served by Express)
├── server.js            # Express proxy + static server
├── package.json
├── .env.example
└── .gitignore
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Azure credentials

```bash
cp .env.example .env
```

Edit `.env` and fill in your three Azure values:

| Variable | Where to find it |
|---|---|
| `AZURE_OPENAI_API_KEY` | Azure Portal → your OpenAI resource → Keys and Endpoint |
| `AZURE_OPENAI_ENDPOINT` | Same page, the Endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT` | Azure AI Studio → Deployments → your GPT-4o Mini deployment name |

### 3. Run

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser.

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Analyze an image with a prompt |
| `GET` | `/health` | Server health + deployment name |

### `/api/analyze` request body

```json
{
  "imageBase64": "<base64 string>",
  "mediaType": "image/jpeg",
  "prompt": "Describe this image"
}
```

### Response

```json
{
  "result": "The image shows...",
  "model": "gpt-4o-mini",
  "usage": { "prompt_tokens": 512, "completion_tokens": 128 }
}
```

## Deployment

Set the three `AZURE_OPENAI_*` environment variables in your host's dashboard (Railway, Render, Fly.io, etc.) and deploy. No build step needed.
