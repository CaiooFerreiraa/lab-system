import { Router } from "express";
import ConfigController from "../controllers/config.controller.js";
import ConfigModel from "../models/config.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new ConfigModel(db);
const controller = new ConfigController(repository);

router.get("/smtp", controller.getSmtpConfig);
router.post("/smtp", controller.setSmtpConfig);

export default router;
