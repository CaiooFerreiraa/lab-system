import nodemailer from 'nodemailer';
import db from '../config/database.js';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async getTransporter() {
    if (this.transporter) return this.transporter;

    const [config] = await db`SELECT valor FROM lab_system.configuracao WHERE id = 'smtp_config'`;

    if (!config || !config.valor.user || !config.valor.pass) {
      console.warn("⚠️ Configuração de SMTP incompleta. Email não será enviado.");
      return null;
    }

    const { host, port, user, pass } = config.valor;

    this.transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port || 587,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    return this.transporter;
  }

  async sendTemplate({ to, subject, html }) {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) return false;

      const [config] = await db`SELECT valor FROM lab_system.configuracao WHERE id = 'smtp_config'`;
      const from = config.valor.from || 'Lab System <noreply@empresa.com>';

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      console.log(`📧 Email enviado para ${to}: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error("❌ Erro ao enviar email:", err);
      return false;
    }
  }

  // Método para invalidar o transporter caso as configurações mudem
  resetTransporter() {
    this.transporter = null;
  }
}

export default new EmailService();
