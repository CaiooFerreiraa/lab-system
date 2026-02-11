import { Router } from "express";
import TestController from "../controllers/test.controller.js";
import TestModel from "../models/test.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new TestModel(db);
const controller = new TestController(repository);

router.post("/register", controller.register);
router.get("/search", controller.search);
router.put("/edit", controller.edit);
router.delete("/delete", controller.remove);
router.get("/read", controller.readAll);
router.get("/report", controller.report);

export default router;
