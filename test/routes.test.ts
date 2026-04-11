import { app } from "#/index.js";
import request from "supertest";

it("should return 404 on non existent pages", async () => {
  await request(app).get("/v0/auth/user_data").expect(404);
});
