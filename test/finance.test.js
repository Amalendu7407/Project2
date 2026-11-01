import test from "node:test";
import assert from "node:assert/strict";
import { initialData } from "../src/data.js";
import { getGroupBalances, simplifyDebts, splitAmount } from "../src/utils/finance.js";

test("equal split distributes remainder in deterministic minor units", () => {
  const shares = splitAmount(1001, ["a", "b", "c"]);
  assert.deepEqual(shares, [{ memberId: "a", amount: 334 }, { memberId: "b", amount: 334 }, { memberId: "c", amount: 333 }]);
  assert.equal(shares.reduce((sum, share) => sum + share.amount, 0), 1001);
});

test("unequal split rejects shares that do not total the expense", () => {
  assert.throws(() => splitAmount(1000, ["a", "b"], "unequal", { a: 400, b: 500 }), /add up to the total/);
  assert.deepEqual(splitAmount(1000, ["a", "b"], "unequal", { a: 400, b: 600 }), [{ memberId: "a", amount: 400 }, { memberId: "b", amount: 600 }]);
});

test("percentage split validates 100 percent and allocates paise", () => {
  const shares = splitAmount(101, ["a", "b"], "percentage", { a: 50, b: 50 });
  assert.equal(shares.reduce((sum, share) => sum + share.amount, 0), 101);
  assert.throws(() => splitAmount(101, ["a", "b"], "percentage", { a: 40, b: 50 }), /100%/);
});

test("group net balances account for expenses and completed settlements", () => {
  const group = { id: "g", members: [{ id: "a" }, { id: "b" }] };
  const expenses = [{ groupId: "g", amount: 1000, payerId: "a", shares: [{ memberId: "a", amount: 500 }, { memberId: "b", amount: 500 }] }];
  const balances = getGroupBalances(group, expenses, [{ groupId: "g", fromId: "b", toId: "a", amount: 200, status: "completed" }]);
  assert.deepEqual(balances, { a: 300, b: -300 });
  assert.equal(Object.values(balances).reduce((sum, amount) => sum + amount, 0), 0);
});

test("debt simplification collapses chained debts to a direct transfer", () => {
  const transfers = simplifyDebts({ alice: -500, bob: 0, charlie: 500 });
  assert.deepEqual(transfers, [{ fromId: "alice", toId: "charlie", amount: 500 }]);
});

test("demo group balances reconcile to zero", () => {
  for (const group of initialData.groups) {
    const balances = getGroupBalances(group, initialData.expenses, initialData.settlements);
    assert.equal(Object.values(balances).reduce((sum, amount) => sum + amount, 0), 0);
  }
});

test("greedy simplification preserves every member's net amount", () => {
  const balances = { a: -700, b: -200, c: 500, d: 400 };
  const transfers = simplifyDebts(balances);
  const remaining = { ...balances };
  transfers.forEach(({ fromId, toId, amount }) => {
    remaining[fromId] += amount;
    remaining[toId] -= amount;
  });
  assert.deepEqual(Object.values(remaining), [0, 0, 0, 0]);
});
