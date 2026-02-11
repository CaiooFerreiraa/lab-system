import { Router } from "express";
import ProductController from "../controllers/product.controller.js";
import ProductModel from "../models/product.model.js";
import { validateProduct } from "../middlewares/validators/product.validator.js";
import db from "../config/database.js";

const router = Router();
const repository = new ProductModel(db);
const controller = new ProductController(repository);

router.post("/register", validateProduct, controller.register);
router.get("/search", controller.search);
router.put("/edit", controller.edit);
router.delete("/delete", controller.remove);
router.get("/read", controller.readAll);
router.get("/list", controller.list);

export default router;
