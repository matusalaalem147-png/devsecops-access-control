const express = require("express");
const { authenticate, requireRole, requirePermission } = require("../middleware/auth");
const { canAccessOrder } = require("../policy");
const { users, orders, payments, getNextOrderId, getNextPaymentId } = require("../store");

const router = express.Router();

router.get("/orders", authenticate, (req, res) => {
  const visibleOrders =
    req.user.role === "admin"
      ? orders
      : orders.filter((o) => o.branchId === req.user.branchId);
  return res.status(200).json({ orders: visibleOrders });
});

router.get("/orders/:id", authenticate, requirePermission("orders:read"), (req, res) => {
  const orderId = Number(req.params.id);
  const order = orders.find((o) => Number(o.id) === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (!canAccessOrder(req.user, order)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return res.status(200).json({ order });
});

router.post("/orders", authenticate, requirePermission("orders:create"), (req, res) => {
  const { item, totalBirr } = req.body || {};
  if (!item || typeof totalBirr !== "number") {
    return res.status(400).json({ error: "Invalid order payload" });
  }

  const branchId = req.user.role === "admin" && req.body.branchId ? req.body.branchId : req.user.branchId;
  if (!branchId) {
    return res.status(400).json({ error: "Branch required" });
  }

  const newOrder = {
    id: getNextOrderId(),
    branchId,
    item,
    totalBirr,
    status: "open"
  };
  orders.push(newOrder);
  return res.status(201).json({ order: newOrder });
});

router.post("/payments", authenticate, requirePermission("payments:create"), (req, res) => {
  const { orderId, amountBirr } = req.body || {};
  const order = orders.find((o) => Number(o.id) === Number(orderId));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (!canAccessOrder(req.user, order)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const payment = {
    id: getNextPaymentId(),
    orderId: order.id,
    branchId: order.branchId,
    amountBirr: amountBirr ?? order.totalBirr,
    paidBy: req.user.id
  };
  payments.push(payment);
  return res.status(201).json({ payment });
});

router.get("/reports/branch", authenticate, requirePermission("reports:read"), (req, res) => {
  const targetBranch = req.user.role === "admin" && req.query.branchId ? String(req.query.branchId) : req.user.branchId;
  const branchOrders = orders.filter((o) => o.branchId === targetBranch);
  const totalRevenue = branchOrders.reduce((sum, o) => sum + o.totalBirr, 0);

  return res.status(200).json({
    branchId: targetBranch,
    orderCount: branchOrders.length,
    totalRevenue,
    orders: branchOrders
  });
});

router.get("/admin/users", authenticate, requireRole("admin"), (_req, res) => {
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  return res.status(200).json({ users: safeUsers });
});

module.exports = router;