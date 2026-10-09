import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

export default function IssueReturn() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [status, setStatus] = useState("issued");
  const [form, setForm] = useState({ bookId: "", memberId: "", days: 14 });
  const [msg, setMsg] = useState(null);

  const loadOptions = useCallback(async () => {
    const [b, m] = await Promise.all([
      api.get("/books", { params: { limit: 100 } }),
      api.get("/members", { params: { limit: 100 } }),
    ]);
    setBooks(b.data.books.filter((x) => x.availableCopies > 0));
    setMembers(m.data.members.filter((x) => x.isActive));
  }, []);

  const loadTxs = useCallback(async () => {
    const { data } = await api.get("/transactions", { params: { status, limit: 50 } });
    setTxs(data.transactions);
  }, [status]);

  useEffect(() => {
    loadOptions().catch((e) => setMsg({ type: "error", text: errMsg(e) }));
  }, [loadOptions]);

  useEffect(() => {
    loadTxs().catch((e) => setMsg({ type: "error", text: errMsg(e) }));
  }, [loadTxs]);

  const issue = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/transactions/issue", {
        bookId: form.bookId,
        memberId: form.memberId,
        days: Number(form.days),
      });
      setMsg({ type: "success", text: "Book issued." });
      setForm({ bookId: "", memberId: "", days: 14 });
      await Promise.all([loadOptions(), loadTxs()]);
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    }
  };

  const giveBack = async (t) => {
    setMsg(null);
    try {
      const { data } = await api.put(`/transactions/${t._id}/return`);
      setMsg({
        type: "success",
        text:
          data.fine > 0
            ? `Returned. ${data.overdueDays} day(s) overdue, fine ₹${data.fine}.`
            : "Returned on time. No fine.",
      });
      await Promise.all([loadOptions(), loadTxs()]);
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    }
  };

  return (
    <>
      <h2>Issue / Return</h2>

      <form className="card" onSubmit={issue}>
        <h3>Issue a book</h3>
        <div className="form-grid">
          <div>
            <label>Book (available only)</label>
            <select required value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
              <option value="">Select a book</option>
              {books.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title} ({b.availableCopies} left)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Member (active only)</label>
            <select required value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">Select a member</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Loan period (days)</label>
            <input type="number" min="1" max="60" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
          </div>
        </div>
        <button className="btn">Issue book</button>
      </form>

      {msg && <p className={msg.type}>{msg.text}</p>}

      <div className="card">
        <div className="toolbar">
          <h3 style={{ margin: 0 }}>Transactions</h3>
          <span className="spacer" />
          <select style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="issued">Currently issued</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Book</th><th>Member</th><th>Issued</th><th>Due</th>
              <th>{status === "returned" ? "Returned / Fine" : "Status"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => {
              const overdue = t.status === "issued" && new Date(t.dueDate) < new Date();
              return (
                <tr key={t._id}>
                  <td>{t.book?.title ?? "(deleted book)"}</td>
                  <td>{t.member?.name ?? "(deleted member)"}</td>
                  <td>{fmt(t.issueDate)}</td>
                  <td>{fmt(t.dueDate)}</td>
                  <td>
                    {t.status === "returned" ? (
                      `${fmt(t.returnDate)} / ₹${t.fine}`
                    ) : (
                      <span className={`badge ${overdue ? "red" : "green"}`}>
                        {overdue ? "Overdue" : "On time"}
                      </span>
                    )}
                  </td>
                  <td>
                    {t.status === "issued" && (
                      <button className="btn small" onClick={() => giveBack(t)}>Return</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {txs.length === 0 && (
              <tr><td colSpan="6">Nothing here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}