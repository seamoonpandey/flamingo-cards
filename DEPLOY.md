# Deployment Guide

This guide details the steps to deploy the Flamingo Cards application to production. The stack consists of a React frontend (Cloudflare Pages) and a PartyKit backend.

## Prerequisites

- **Node.js** (v18+) installed.
- **Cloudflare Account**: For hosting the frontend.
- **PartyKit Account**: For hosting the real-time server.
- **Wrangler CLI**: Installed globally or accessible via `npx`.

## 1. Deploy the Backend (PartyKit)

The real-time server must be deployed first to generate the connection URL.

1.  **Login to PartyKit** (if not already logged in):
    ```bash
    npx partykit login
    ```

2.  **Deploy the Server**:
    ```bash
    npx partykit deploy
    ```

    **Output**: The terminal will display the deployed host URL (e.g., `https://flamingo-party.yourname.partykit.dev`). **Copy this URL**, you will need it for the next step.

## 2. Deploy the Frontend (Cloudflare Pages)

The frontend needs to be built with the PartyKit host URL baked in.

1.  **Build the Project**:
    Replace `your-partykit-host.dev` with the URL you copied in the previous step.

    ```bash
    # Linux/Mac
    VITE_PARTYKIT_HOST=your-partykit-host.dev npm run build

    # Windows (PowerShell)
    $env:VITE_PARTYKIT_HOST="your-partykit-host.dev"; npm run build
    ```

2.  **Deploy to Cloudflare Pages**:
    Use Wrangler to upload the `dist` folder.

    ```bash
    npx wrangler pages deploy dist --project-name flamingo-cards
    ```

    *Note: You may be prompted to log in to Cloudflare on the first run.*

## Summary of Commands

For subsequent updates, you can run:

```bash
# 1. Update Backend
npx partykit deploy

# 2. Update Frontend (ensure VITE_PARTYKIT_HOST is set correct)
VITE_PARTYKIT_HOST=https://flamingo-party.yourname.partykit.dev npm run build
npx wrangler pages deploy dist
```
