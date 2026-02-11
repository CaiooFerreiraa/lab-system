import { Router } from "express";
import MarkController from "../controllers/mark.controller.js";
import MarkModel from "../models/mark.model.js";
import { validateMark } from "../middlewares/validators/mark.validator.js";
import db from "../config/database.js";

const router = Router();
const repository = new MarkModel(db);
const controller = new MarkController(repository);

router.post("/register", validateMark, controller.register);
router.get("/view", controller.readAll);
router.get("/list", controller.listTypes);
router.get("/listTypeShoes", controller.listTypeShoes);
router.get("/update/:name", controller.getOne);
router.put("/updateMark", validateMark, controller.update);
router.delete("/delete/:name", controller.remove);
router.delete("/delete/method/:id", controller.removeMethod);

export default router;
