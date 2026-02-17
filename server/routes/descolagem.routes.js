import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import DescolagemController from "../controllers/descolagem.controller.js";
import DescolagemModel from "../models/descolagem.model.js";
import db from "../config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

// Garante que a pasta uploads existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos."));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
const repository = new DescolagemModel(db);
const controller = new DescolagemController(repository);

router.use(protect);

router.post("/upload", upload.single("arquivo"), controller.upload);
router.get("/read", controller.readAll);
router.get("/report", controller.getReport);
router.get("/search", controller.search);
router.delete("/delete", controller.remove);

export default router;
