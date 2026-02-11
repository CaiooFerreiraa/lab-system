import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error-handler.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de CORS para suportar Vercel e outros domínios de produção
const allowedOrigins = [
  process.env.FRONTEND_URL,    // URL final da Vercel (ex: https://lab-system.vercel.app)
  "http://localhost:5173",     // Desenvolvimento local (Vite)
  "http://localhost:3000",
  /\.vercel\.app$/             // Permite qualquer preview da Vercel
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps ou curl) ou se estiver na lista permitida
      if (!origin || allowedOrigins.some(ao => ao instanceof RegExp ? ao.test(origin) : ao === origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

// Servir uploads (PDFs)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api", routes);

// Compatibilidade com rotas antigas (sem /api)
app.use(routes);

// Rota raiz para status
app.get("/", (_req, res) => {
  res.send("✅ API Lab System rodando...");
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
