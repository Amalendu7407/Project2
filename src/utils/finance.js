export function splitAmount(amount, participantIds, method = "equal", values = {}) {
  const ids = [...new Set(participantIds)];
  if (!Number.isSafeInteger(amount) || amount <= 0 || ids.length === 0) {
    throw new Error("Enter a valid amount and select at least one participant.");
  }

  let shares;
  if (method === "equal") {
    const base = Math.floor(amount / ids.length);
    let remainder = amount % ids.length;
    shares = ids.map((id) => {
      const share = base + (remainder > 0 ? 1 : 0);
      remainder -= remainder > 0 ? 1 : 0;
      return { memberId: id, amount: share };
    });
  } else if (method === "unequal") {
    shares = ids.map((id) => ({ memberId: id, amount: Number(values[id]) }));
    if (shares.some((share) => !Number.isSafeInteger(share.amount) || share.amount < 0)
      || shares.reduce((sum, share) => sum + share.amount, 0) !== amount) {
      throw new Error("Individual shares must be whole paise and add up to the total.");
    }
  } else if (method === "percentage") {
    const percentages = ids.map((id) => Number(values[id]));
    if (percentages.some((value) => !Number.isFinite(value) || value < 0)
      || Math.round(percentages.reduce((sum, value) => sum + value, 0) * 100) !== 10000) {
      throw new Error("Participant percentages must add up to 100%.");
    }
    const exact = ids.map((id, index) => ({ memberId: id, exact: amount * percentages[index] / 100 }));
    shares = exact.map(({ memberId, exact: share }) => ({ memberId, amount: Math.floor(share) }));
    let remainder = amount - shares.reduce((sum, share) => sum + share.amount, 0);
    exact
      .map((share, index) => ({ index, fraction: share.exact - Math.floor(share.exact) }))
      .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
      .slice(0, remainder)
      .forEach(({ index }) => { shares[index].amount += 1; });
  } else {
    throw new Error("Choose a supported split method.");
  }
  return shares;
}

export function getGroupBalances(group, expenses, settlements = []) {
  const balances = Object.fromEntries(group.members.map((member) => [member.id, 0]));
  expenses.filter((expense) => expense.groupId === group.id).forEach((expense) => {
    if (balances[expense.payerId] === undefined) balances[expense.payerId] = 0;
    balances[expense.payerId] += expense.amount;
    expense.shares.forEach(({ memberId, amount }) => {
      if (balances[memberId] === undefined) balances[memberId] = 0;
      balances[memberId] -= amount;
    });
  });
  settlements
    .filter((settlement) => settlement.groupId === group.id && settlement.status === "completed")
    .forEach(({ fromId, toId, amount }) => {
      balances[fromId] = (balances[fromId] || 0) + amount;
      balances[toId] = (balances[toId] || 0) - amount;
    });
  return balances;
}

export function simplifyDebts(balances) {
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < 0)
    .map(([memberId, amount]) => ({ memberId, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0)
    .map(([memberId, amount]) => ({ memberId, amount }))
    .sort((a, b) => b.amount - a.amount);
  const transfers = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ fromId: debtor.memberId, toId: creditor.memberId, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }
  return transfers;
}

export function formatMoney(minorUnits, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((minorUnits || 0) / 100);
}

export function exportCsv(rows, columns, filename) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const csv = [columns.map((column) => escape(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(","))].join("\r\n");
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
