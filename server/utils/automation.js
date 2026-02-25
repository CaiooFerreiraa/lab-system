import cron from 'node-cron';
import emailService from './email-service.js';
import db from '../config/database.js';
import TestModel from '../models/test.model.js';
import NotificacaoModel from '../models/notificacao.model.js';

const testModel = new TestModel(db);
const notificacaoModel = new NotificacaoModel(db);

/**
 * Automação de Relatórios e Alertas
 */
class AutomationService {
  init() {
    console.log("🕒 Iniciando agendador de tarefas (Cron)...");

    // 1. Relatório Diário - 09:00 da manhã
    cron.schedule('0 9 * * *', () => {
      this.sendDailyReport();
    });

    // 2. Verificação de Atrasos - A cada 30 minutos
    cron.schedule('*/30 * * * *', () => {
      this.checkTestDelays();
    });
  }

  async sendDailyReport() {
    console.log("📊 Gerando relatório diário das 09:00...");
    try {
      const report = await testModel.getReport();
      const emails = await notificacaoModel.getEmailsByType('relatorio_diario');

      if (emails.length === 0) return;

      const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="color: #3b82f6;">📊 Relatório Diário de Atividades</h2>
          <p>Resumo das atividades do laboratório até às 09:00 de hoje.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1; text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${report.summary.total}</div>
              <div style="font-size: 12px; color: #64748b;">Laudos Totais</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${report.summary.aprovados}</div>
              <div style="font-size: 12px; color: #64748b;">Aprovados</div>
            </div>
          </div>
          <p>Para ver detalhes completos com gráficos e imagens, acesse o sistema:</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/test/report" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Ver Relatório Completo
          </a>
          <footer style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
            Este é um email automático enviado pelo Lab System.
          </footer>
        </div>
      `;

      for (const { email } of emails) {
        await emailService.sendTemplate({
          to: email,
          subject: `Relatório Diário Laboratório - ${new Date().toLocaleDateString()}`,
          html
        });
      }
    } catch (err) {
      console.error("❌ Falha na automação de relatório:", err);
    }
  }

  async checkTestDelays() {
    console.log("⚠️ Verificando testes atrasados...");
    try {
      const delayed = await testModel.getDelayedTests();
      if (delayed.length === 0) return;

      const emails = await notificacaoModel.getEmailsByType('fallback_atraso');
      if (emails.length === 0) return;

      const testList = delayed.map(t => `<li><strong>Teste #${t.cod_teste}</strong>: ${t.tipo_teste} (${t.maquina || 'Sem Máquina'}) - Atrasado há ${Math.floor(t.atraso_segundos / 3600)}h</li>`).join('');

      const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 8px; padding: 20px;">
          <h2 style="color: #ef4444;">⚠️ Alerta de Atraso Crítico</h2>
          <p>Os seguintes testes excederam o tempo limite estimado e requerem atenção:</p>
          <ul>${testList}</ul>
          <p>Acesse o painel de controle para mais informações.</p>
        </div>
      `;

      for (const { email } of emails) {
        await emailService.sendTemplate({
          to: email,
          subject: `⚠️ ALERTA: Testes Atrasados no Laboratório`,
          html
        });
      }
    } catch (err) {
      console.error("❌ Falha na verificação de atrasos:", err);
    }
  }
}

export default new AutomationService();
