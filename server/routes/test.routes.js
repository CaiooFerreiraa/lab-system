import { Router } from "express";
import TestController from "../controllers/test.controller.js";
import TestModel from "../models/test.model.js";
import db from "../config/database.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
const repository = new TestModel(db);
const controller = new TestController(repository);

router.use(protect); // Aplica proteção e req.user para todas as rotas de teste

router.post("/register", controller.register);
router.get("/search", controller.search);
router.put("/edit", controller.edit);
router.delete("/delete", controller.remove);
router.get("/read", controller.readAll);
router.get("/read-laudos", controller.readAllLaudos);
router.get("/laudo/:id", controller.getLaudo);
router.put("/laudo/:id", controller.editLaudo);
router.delete("/laudo/:id", controller.deleteLaudo);
router.post("/laudo/:laudoId/add-test", controller.addTestToLaudo);
router.post("/laudo/:id/receive", controller.receiveLaudo);
router.get("/report", controller.report);
router.get("/delayed", controller.getDelayedTests);

export default router;
