import { asyncHandler } from "../middlewares/error-handler.js";

export default class EnumController {
  constructor(repository) {
    this.repository = repository;
  }

  listTypeStatusTests = asyncHandler(async (_req, res) => {
    const data = await this.repository.listTypeStatusTest();
    res.json({ success: true, data });
  });

  listTypeTests = asyncHandler(async (_req, res) => {
    const data = await this.repository.listTypeTest();
    res.json({ success: true, data });
  });
}
