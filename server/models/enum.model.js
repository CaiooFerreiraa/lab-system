export default class EnumModel {
  constructor(db) {
    this.db = db;
  }

  async listTypeStatusTest() {
    const result = await this.db`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'status_enum';
    `;
    return result;
  }

  async listTypeTest() {
    const defaultTypes = [
      'DUREZA', 'DENSIDADE', 'RESILIENCIA', 'ENCOLHIMENTO', 'COMPRESSION SET',
      'RASGAMENTO', 'ALONGAMENTO', 'TRACAO', 'ABRASAO DIN', 'ABRASAO AKRON', 'MODULO 300%',
      'TEOR DE GEIS', 'TEOR DE UMIDADE_DE_SILICA', 'UMIDADE DE EVA', 'VOLUME DE GAS',
      'BLOOMING', 'ENVELHECIMENTO', 'HIDROLISE', 'DESCOLAGEM', 'RESISTENCIA A LAVAGEM'
    ];

    try {
      const result = await this.db`
        SELECT 
          cod_tipo, 
          nome::text as nome,
          nome::text as enumlabel
        FROM lab_system.tipo 
        ORDER BY nome ASC;
      `;

      if (result.length > 0) return result;
    } catch (e) {
      console.error("Erro ao buscar tipos do banco, usando fallback estático:", e);
    }

    // Retorno de emergência se o banco falhar ou estiver vazio
    return defaultTypes.map((t, i) => ({
      cod_tipo: i + 1,
      nome: t,
      enumlabel: t
    }));
  }
}
