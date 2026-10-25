# NyayVivek demo setup - separate copy

CONTENTS: a replacement-file bundle, not a full project. You apply these files
on top of your own copy of the NyayVivek repo (clone from GitHub first), then
follow the steps below. Windows steps can be run by Antigravity.

This bundle modifies a SEPARATE COPY of the NyayVivek project. The GitHub main
branch and the live Vercel site are unchanged. Changes were tested on Linux;
Windows is not tested yet.

## What changes in this copy

1. Long-document analysis (NyayVivek-ML): the case text is split into
   overlapping chunks sized by the model's own tokenizer, each chunk is
   searched, and the best match per case is kept. Previously only the first
   256 word pieces (roughly the opening 150-200 words) influenced matching.
   Short documents behave exactly as before. Retrieval quality on real legal
   PDFs is not validated.
2. Single-origin serving (server + client): Express serves the built frontend
   and the API on one origin, so login cookies work behind a public link
   without cookie or CORS changes. Client API calls fall back to a relative
   "/api" path when VITE_API_URL is unset, so the tunnel URL never needs a
   client rebuild. Local development still uses VITE_API_URL=http://localhost:5000.
3. Login enforcement fix (server + client): previously the server silently mapped every
   request without a valid login to one shared built-in account - and because
   the token check used a different secret than login, this applied to every
   request. All uploaded cases were landing in that shared account, visible to
   anyone who reached the API. The dossier and file routes themselves do check
   ownership correctly; this fix makes login actually required (401 on
   missing/invalid token). Verified: without a token the API now refuses
   access, and one account cannot see another account's cases.

## Prerequisites (Windows)

- Node.js 20 or newer
- Python 3.11 (required package wheels exist for Windows)
- MongoDB: either MongoDB Community Server installed locally, or a free
  MongoDB Atlas M0 cluster (no card required)
- Tesseract OCR for Windows (UB Mannheim installer); add its folder to PATH
- cloudflared, only if a public link is needed
- Git

## Setup steps

1. Copy the project to a new folder (the demo copy).
2. Replace files:
   - files/model_manager.py      -> NyayVivek-ML/app/services/model_manager.py
   - files/app.js                -> server/src/app.js
   - files/protected.js          -> server/src/middleware/protected.js
   - client-files/axios.js       -> client/src/api/axios.js
   - client-files/WorkspacePage.jsx -> client/src/pages/WorkspacePage.jsx
   - client-files/DashboardPage.jsx -> client/src/pages/DashboardPage.jsx
   - client-files/Auth.jsx         -> client/src/components/Auth.jsx
3. In NyayVivek-ML: python -m venv .venv, activate it, then
   pip install -r requirements.txt   (large download, includes PyTorch)
4. In server and in client: npm install
5. server/.env (new values only - do not reuse any old or shared secrets):
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/NyayVivek
     JWT_SECRET=<new random value>
     ACCESS_TOKEN_SECRET=<new random value>
     REFRESH_TOKEN_SECRET=<new random value>
     CLIENT_URL=http://localhost:5000
     ML_SERVICE_URL=http://127.0.0.1:8000
6. In client: npm run build
   - For the PUBLIC build (served by Express behind the tunnel): make sure
     client\.env does NOT set VITE_API_URL (comment it out) so the app calls
     the same origin it was loaded from.
   - For LOCAL development with the Vite dev server (npm run dev), keep
     VITE_API_URL=http://localhost:5000 in client\.env instead.

## Run

- start-0-database.bat     (local MongoDB only; skip if using Atlas)
- start-1-ml-service.bat   (first run downloads the ~90MB language model once)
- start-2-backend.bat
- Local demo: open http://localhost:5000
- Public link: start-3-public-link.bat and share the printed
  https://<random>.trycloudflare.com URL. The URL changes every time the
  tunnel restarts, and the laptop must stay on and online while people use it.

## Hosted alternative to keeping the laptop on

Railway: not available right now - new sign-ups are disabled (observed
25 Oct 2026). Recheck later; no workaround is recommended.

Azure for Students: $100 credit for 12 months, no credit card, for full-time
university students verified through a college email address. Sign up at
https://azure.microsoft.com/en-us/free/students . Verification time depends on
whether the college email is recognized. When the credit ends the account is
disabled unless you choose paid, so this is a capped student offer, not a
permanent free host. Hosting the project on Azure has not been set up or
cost-tested yet.

## Current limits to know before the demo

- PDFs up to 45MB each, up to 10 per case, PDF only.
- Scanned PDFs are OCR'd page by page (roughly seconds per page); long scans
  are slow, so run them once before presenting.
- Analysis is similarity matching over 106 pilot cases, not a validated
  legal predictor.
- Uploaded files are stored on the machine running the server.
- If the backend is unreachable, the app now shows an error instead of the
  old behavior that entered the app with a made-up offline account.
