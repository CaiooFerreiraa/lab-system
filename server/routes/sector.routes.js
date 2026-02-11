import { Router } from "express";
import SectorController from "../controllers/sector.controller.js";
import SectorModel from "../models/sector.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new SectorModel(db);
const controller = new SectorController(repository);

router.post("/register", controller.register);
router.get("/search", controller.search);
router.put("/edit", controller.edit);
router.delete("/delete", controller.remove);
router.get("/read", controller.readAll);
router.get("/list", controller.list);

export default router;
