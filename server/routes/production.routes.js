import { Router } from "express";
import ProductionController from "../controllers/production.controller.js";
import ProductionModel from "../models/production.model.js";
import db from "../config/database.js";

const router = Router();
const model = new ProductionModel(db);
const controller = new ProductionController(model);

router.get("/options", controller.list);
router.get("/options/:cat", controller.getByCategory);
router.post("/options", controller.register);
router.delete("/options/:id", controller.delete);

export default router;
