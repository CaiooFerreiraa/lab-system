import { Router } from "express";
import EnumController from "../controllers/enum.controller.js";
import EnumModel from "../models/enum.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new EnumModel(db);
const controller = new EnumController(repository);

router.get("/status", controller.listTypeStatusTests);
router.get("/typestest", controller.listTypeTests);

export default router;
