import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoute.js';
import dossierRoutes from './routes/dossierRoute.js';

const app = express();


app.use(
  cors({
    origin: [
      "https://laww-flame.vercel.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dossiers", dossierRoutes);

// --- Single-origin demo serving ---
// Serves the built React client from this same Express origin so the public
// tunnel link, the client and the API share one origin (no CORS or cookie
// changes needed). Build the client first: cd client && npm run build
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

export default app;