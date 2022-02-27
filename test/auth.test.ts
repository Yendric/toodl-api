import request from "supertest";
import { app } from "../src";

describe("GET /v1/auth/user_data", () => {
  it("should say logged out", () => {
    request(app)
      .get("/v1/auth/user_data")
      .end((err, res) => {
        expect(res.status).toBe(401);
        expect(err).toBeFalsy();
        expect(res.body.message).toContain("Gelieve u eerst in te loggen");
      });
  });
});
