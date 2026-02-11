import { Router } from "express";
import BalancaController from "../controllers/balanca.controller.js";
import BalancaModel from "../models/balanca.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new BalancaModel(db);
const controller = new BalancaController(repository);

router.get("/read", controller.readAll);
router.get("/search/:id", controller.search);
router.post("/register", controller.register);
router.put("/edit", controller.edit);
router.delete("/delete/:id", controller.remove);

export default router;
