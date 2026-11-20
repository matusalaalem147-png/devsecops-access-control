const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-signing-key-with-at-least-32-chars-123456";
process.env.JWT_ISSUER = "dinedesk-api";
process.env.JWT_AUDIENCE = "dinedesk-client";

const { createApp } = require("../src/app");
const app = createApp();

async function loginAs(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

describe("DineDesk authentication, RBAC, and branch-level authorization", () => {
  test("no token -> 401", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  test("token signed with wrong key -> 401", async () => {
    const badToken = jwt.sign(
      { sub: 1, role: "waiter", branchId: "bole" },
      "different-secret-key-that-is-also-32-chars-long!!",
      { algorithm: "HS256", expiresIn: "15m", issuer: "dinedesk-api", audience: "dinedesk-client" }
    );
    const res = await request(app).get("/api/orders").set("Authorization", `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  test("expired token -> 401", async () => {
    const expiredToken = jwt.sign(
      { sub: 1, role: "waiter", branchId: "bole" },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "-10s", issuer: "dinedesk-api", audience: "dinedesk-client" }
    );
    const res = await request(app).get("/api/orders").set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test("waiter calling GET /api/admin/users -> 403", async () => {
    const token = await loginAs("waiter.bole@dinedesk.local", "WaiterBole!2026");
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("administrator calling GET /api/admin/users -> 200 with no password hashes", async () => {
    const token = await loginAs("admin@dinedesk.local", "AdminChain!2026");
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    for (const u of res.body.users) {
      expect(u.passwordHash).toBeUndefined();
    }
  });

  test("waiter creating an order -> 201", async () => {
    const token = await loginAs("waiter.bole@dinedesk.local", "WaiterBole!2026");
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ item: "Spiced Tea", totalBirr: 120 });
    expect(res.status).toBe(201);
    expect(res.body.order.branchId).toBe("bole");
  });

  test("cashier creating an order -> 403", async () => {
    const token = await loginAs("cashier.bole@dinedesk.local", "CashierBole!2026");
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ item: "Spiced Tea", totalBirr: 120 });
    expect(res.status).toBe(403);
  });

  test("Bole manager reading a Bole order -> 200", async () => {
    const token = await loginAs("manager.bole@dinedesk.local", "ManagerBole!2026");
    const res = await request(app).get("/api/orders/101").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.order.branchId).toBe("bole");
  });

  test("Bole manager reading a Piassa order -> 403", async () => {
    const token = await loginAs("manager.bole@dinedesk.local", "ManagerBole!2026");
    const res = await request(app).get("/api/orders/201").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("waiter calling GET /api/reports/branch -> 403", async () => {
    const token = await loginAs("waiter.bole@dinedesk.local", "WaiterBole!2026");
    const res = await request(app).get("/api/reports/branch").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("Piassa manager calling /api/reports/branch?branchId=bole -> still only Piassa data", async () => {
    const token = await loginAs("manager.piassa@dinedesk.local", "ManagerPiassa!2026");
    const res = await request(app)
      .get("/api/reports/branch?branchId=bole")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.branchId).toBe("piassa");
  });

  test("login ignores client-supplied role or branchId in body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "waiter.bole@dinedesk.local",
        password: "WaiterBole!2026",
        role: "admin",
        branchId: "piassa"
      });
    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.role).toBe("waiter");
    expect(decoded.branchId).toBe("bole");
  });
});
