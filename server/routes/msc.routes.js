import { Router } from "express";
import MSCController from "../controllers/msc.controller.js";
import MSCModel from "../models/msc.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new MSCModel(db);
const controller = new MSCController(repository);

router.post("/register", controller.register);
router.get("/read", controller.readAll);
router.get("/search/:id", controller.getOne);
router.put("/edit", controller.edit);

export default router;
