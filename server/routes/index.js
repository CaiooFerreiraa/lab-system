import { Router } from "express";
import employeeRoutes from "./employee.routes.js";
import markRoutes from "./mark.routes.js";
import productRoutes from "./product.routes.js";
import sectorRoutes from "./sector.routes.js";
import modelRoutes from "./model.routes.js";
import testRoutes from "./test.routes.js";
import enumRoutes from "./enum.routes.js";
import descolagemRoutes from "./descolagem.routes.js";
import mscRoutes from "./msc.routes.js";
import balancaRoutes from "./balanca.routes.js";
import authRoutes from "./auth.routes.js";
import productionRoutes from "./production.routes.js";
import maquinaRoutes from "./maquina.routes.js";
import notificacaoRoutes from "./notificacao.routes.js";
import configRoutes from "./config.routes.js";


const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Lab System API v1.0",
    endpoints: [
      "/api/employee",
      "/api/mark",
      "/api/product",
      "/api/sector",
      "/api/model",
      "/api/test",
      "/api/enum",
      "/api/balanca",
      "/api/auth"
    ],
  });
});

router.use("/employee", employeeRoutes);
router.use("/mark", markRoutes);
router.use("/product", productRoutes);
router.use("/sector", sectorRoutes);
router.use("/model", modelRoutes);
router.use("/test", testRoutes);
router.use("/enum", enumRoutes);
router.use("/descolagem", descolagemRoutes);
router.use("/msc", mscRoutes);
router.use("/balanca", balancaRoutes);
router.use("/auth", authRoutes);
router.use("/production", productionRoutes);
router.use("/maquina", maquinaRoutes);
router.use("/notificacao", notificacaoRoutes);
router.use("/config", configRoutes);


export default router;
