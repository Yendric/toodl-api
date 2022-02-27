import request from "supertest";
import { app } from "../src";

it("should return 404 on non existent pages", (done) => {
  request(app).get("/v0/auth/user_data").expect(404, done);
});
