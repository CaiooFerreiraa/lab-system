import { asyncHandler } from "../middlewares/error-handler.js";
import emailService from "../utils/email-service.js";

export default class ConfigController {
  constructor(repository) {
    this.repository = repository;
  }

  getSmtpConfig = asyncHandler(async (_req, res) => {
    const config = await this.repository.get('smtp_config');
    // Não retornar a senha por segurança no GET (opcional, dependendo da necessidade do admin de ver)
    const secureConfig = { ...config?.valor };
    if (secureConfig.pass) secureConfig.pass = '********';
    res.json({ success: true, data: secureConfig });
  });

  setSmtpConfig = asyncHandler(async (req, res) => {
    const config = await this.repository.set('smtp_config', req.body);
    emailService.resetTransporter(); // Reinicia o transporter para usar novas configs
    res.json({ success: true, data: config });
  });
}
