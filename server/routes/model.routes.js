import { Router } from "express";
import ModelController from "../controllers/model.controller.js";
import ModelModel from "../models/model.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new ModelModel(db);
const controller = new ModelController(repository);

router.get("/read", controller.readAll);
router.post("/register", controller.register);
router.get("/search/:uuid", controller.search);
router.put("/edit", controller.edit);
router.put("/link-msc", controller.linkMSC);
router.delete("/delete", controller.remove);

export default router;
