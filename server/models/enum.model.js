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
    const result = await this.db`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'tipo_enum';
    `;
    return result;
  }
}
