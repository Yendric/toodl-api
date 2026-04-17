import { app } from "#/index.js";
import request from "supertest";

describe("GET /v1/auth/user_data", () => {
  it("should say logged out", async () => {
    const res = await request(app).get("/v1/auth/user_data");
    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Gelieve u eerst in te loggen");
  });
});
