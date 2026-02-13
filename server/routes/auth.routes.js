import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import UserModel from "../models/user.model.js";
import db from "../config/database.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();
const repository = new UserModel(db);
const controller = new AuthController(repository);

// Público
router.post("/login", controller.login);

// Autenticado
router.get("/me", protect, controller.me);

// Admin + Moderator: registrar novos usuários
router.post("/register", protect, authorize('admin', 'moderator'), controller.register);

// Admin + Moderator: listar usuários
router.get("/users", protect, authorize('admin', 'moderator'), controller.listUsers);

// Somente Admin: remover e alterar cargo
router.delete("/users/:id", protect, authorize('admin'), controller.removeUser);
router.put("/users/:id/role", protect, authorize('admin'), controller.updateRole);

export default router;
