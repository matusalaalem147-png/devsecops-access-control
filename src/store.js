// In-memory seed data for DineDesk (no database). All passwords are INVENTED demo values,
// and only their bcrypt hashes are kept in memory — plaintext is never stored.
const bcrypt = require("bcrypt");

const ROUNDS = 10;
const hash = (pw) => bcrypt.hashSync(pw, ROUNDS);

const users = [
  { id: 1, email: "waiter.bole@dinedesk.local", role: "waiter", branchId: "bole", passwordHash: hash("WaiterBole!2026") },
  { id: 2, email: "waiter.piassa@dinedesk.local", role: "waiter", branchId: "piassa", passwordHash: hash("WaiterPiassa!2026") },
  { id: 3, email: "cashier.bole@dinedesk.local", role: "cashier", branchId: "bole", passwordHash: hash("CashierBole!2026") },
  { id: 4, email: "cashier.piassa@dinedesk.local", role: "cashier", branchId: "piassa", passwordHash: hash("CashierPiassa!2026") },
  { id: 5, email: "manager.bole@dinedesk.local", role: "manager", branchId: "bole", passwordHash: hash("ManagerBole!2026") },
  { id: 6, email: "manager.piassa@dinedesk.local", role: "manager", branchId: "piassa", passwordHash: hash("ManagerPiassa!2026") },
  { id: 7, email: "admin@dinedesk.local", role: "admin", branchId: null, passwordHash: hash("AdminChain!2026") }
];

const orders = [
  { id: 101, branchId: "bole", item: "Shiro with injera", totalBirr: 250, status: "open" },
  { id: 102, branchId: "bole", item: "Macchiato x2", totalBirr: 120, status: "paid" },
  { id: 201, branchId: "piassa", item: "Tibs", totalBirr: 420, status: "open" },
  { id: 202, branchId: "piassa", item: "Spiced tea", totalBirr: 60, status: "paid" }
];

const payments = [];

let nextOrderId = 300;
let nextPaymentId = 1;
const getNextOrderId = () => nextOrderId++;
const getNextPaymentId = () => nextPaymentId++;

module.exports = { users, orders, payments, getNextOrderId, getNextPaymentId };
