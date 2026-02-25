import { Router } from "express";
import NotificacaoController from "../controllers/notificacao.controller.js";
import NotificacaoModel from "../models/notificacao.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new NotificacaoModel(db);
const controller = new NotificacaoController(repository);

router.get("/emails", controller.readAllEmails);
router.post("/emails", controller.registerEmail);
router.delete("/emails/:id", controller.removeEmail);

export default router;
