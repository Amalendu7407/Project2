import { useEffect, useMemo, useState } from 'react';
import { initialData } from './data.js';
import { formatMoney, getGroupBalances, simplifyDebts } from './utils/finance.js';

const STORAGE_KEY = 'splitmate-react-demo-v1';

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialData;
    try {
      return JSON.parse(saved);
    } catch {
      return initialData;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const currentUser = useMemo(() => {
    const allMembers = data.groups.flatMap((group) => group.members);
    return allMembers.find((member) => member.id === data.currentUserId) ?? data.groups[0]?.members[0];
  }, [data]);

  const totalSpend = useMemo(
    () => data.expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [data.expenses],
  );

  const balancesByGroup = useMemo(() => {
    return data.groups.map((group) => {
      const balances = getGroupBalances(group, data.expenses, data.settlements);
      const simplified = simplifyDebts(balances)
        .map((transfer) => ({
          from: group.members.find((member) => member.id === transfer.fromId)?.name ?? transfer.fromId,
          to: group.members.find((member) => member.id === transfer.toId)?.name ?? transfer.toId,
          amount: transfer.amount,
        }))
        .filter((transfer) => transfer.amount > 0);

      return {
        group,
        balances,
        simplified,
      };
    });
  }, [data]);

  const userNetBalance = useMemo(() => {
    return balancesByGroup.reduce((sum, item) => sum + (item.balances[currentUser.id] ?? 0), 0);
  }, [balancesByGroup, currentUser.id]);

  const totalOwe = useMemo(
    () => balancesByGroup.reduce((sum, item) => sum + Math.max(0, -(item.balances[currentUser.id] ?? 0)), 0),
    [balancesByGroup, currentUser.id],
  );

  const totalOwed = useMemo(
    () => balancesByGroup.reduce((sum, item) => sum + Math.max(0, item.balances[currentUser.id] ?? 0), 0),
    [balancesByGroup, currentUser.id],
  );

  const recentExpenses = useMemo(
    () => [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    [data.expenses],
  );

  const categoryTotals = useMemo(() => {
    const map = new Map();
    for (const expense of data.expenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    }
    return [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [data.expenses]);

  const [form, setForm] = useState({
    title: '',
    category: 'Food & drink',
    amount: '',
    groupId: data.groups[0]?.id ?? '',
    payerId: data.groups[0]?.members[0]?.id ?? '',
  });

  useEffect(() => {
    if (!data.groups.some((group) => group.id === form.groupId)) {
      setForm((prev) => ({ ...prev, groupId: data.groups[0]?.id ?? '' }));
    }
  }, [data.groups, form.groupId]);

  const selectedGroup = data.groups.find((group) => group.id === form.groupId) ?? data.groups[0];

  const handleAddExpense = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !selectedGroup) return;

    const payerId = form.payerId || selectedGroup.members[0].id;
    const memberIds = selectedGroup.members.map((member) => member.id);
    const equalShare = Math.floor(amount / memberIds.length);
    const remainder = amount % memberIds.length;

    const shares = memberIds.map((memberId, index) => ({
      memberId,
      amount: equalShare + (index < remainder ? 1 : 0),
    }));

    const newExpense = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      amount,
      category: form.category,
      groupId: selectedGroup.id,
      payerId,
      shares,
      splitMethod: 'equal',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    };

    setData((current) => ({
      ...current,
      expenses: [newExpense, ...current.expenses],
    }));

    setForm({
      title: '',
      category: 'Food & drink',
      amount: '',
      groupId: selectedGroup.id,
      payerId: selectedGroup.members[0]?.id ?? '',
    });
  };

  const deleteExpense = (id) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }));
  };

  return (
    <div className="min-vh-100 bg-light text-dark">
      <div className="container py-4 py-lg-5">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary rounded-4 shadow-sm px-3 py-3 mb-4">
          <div className="container-fluid px-0">
            <span className="navbar-brand fw-bold">SplitMate</span>
            <span className="text-white-50 small">Shared expenses, made simple</span>
          </div>
        </nav>

        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Total spend</div>
                <h3 className="mt-2 mb-0">{formatMoney(totalSpend, data.preferences.currency)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">You owe</div>
                <h3 className="mt-2 mb-0 text-danger">{formatMoney(totalOwe, data.preferences.currency)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">You are owed</div>
                <h3 className="mt-2 mb-0 text-success">{formatMoney(totalOwed, data.preferences.currency)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Net balance</div>
                <h3 className={`mt-2 mb-0 ${userNetBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatMoney(Math.abs(userNetBalance), data.preferences.currency)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Add expense</h4>
                  <span className="badge bg-light text-dark">{selectedGroup?.name}</span>
                </div>

                <form onSubmit={handleAddExpense} className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      placeholder="Dinner"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                    >
                      <option>Food & drink</option>
                      <option>Groceries</option>
                      <option>Transport</option>
                      <option>Accommodation</option>
                      <option>Entertainment</option>
                      <option>Utilities</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={form.amount}
                      onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Group</label>
                    <select
                      className="form-select"
                      value={form.groupId}
                      onChange={(event) => setForm({ ...form, groupId: event.target.value, payerId: selectedGroup?.members[0]?.id ?? '' })}
                    >
                      {data.groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-1 d-flex align-items-end">
                    <button className="btn btn-primary w-100" type="submit">Add</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Recent expenses</h4>
                  <span className="text-muted small">{data.expenses.length} records</span>
                </div>
                <div className="list-group list-group-flush">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{expense.title}</div>
                        <div className="small text-muted">
                          {expense.category} · {expense.date}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <strong>{formatMoney(expense.amount, data.preferences.currency)}</strong>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteExpense(expense.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h4 className="mb-3">Spending by category</h4>
                {categoryTotals.map((item) => (
                  <div key={item.name} className="mb-3">
                    <div className="d-flex justify-content-between small">
                      <span>{item.name}</span>
                      <strong>{formatMoney(item.amount, data.preferences.currency)}</strong>
                    </div>
                    <div className="progress mt-1" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-primary"
                        style={{ width: `${(item.amount / totalSpend) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h4 className="mb-3">Balances</h4>
                {balancesByGroup.map(({ group, balances }) => (
                  <div key={group.id} className="mb-3">
                    <div className="fw-semibold">{group.name}</div>
                    <div className="small text-muted">{group.members.length} members</div>
                    <div className="mt-2 small">
                      {group.members.map((member) => (
                        <div key={member.id} className="d-flex justify-content-between py-1">
                          <span>{member.name}</span>
                          <strong className={balances[member.id] >= 0 ? 'text-success' : 'text-danger'}>
                            {formatMoney(Math.abs(balances[member.id] ?? 0), data.preferences.currency)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
