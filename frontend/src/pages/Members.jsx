import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";

const empty = { name: "", email: "", phone: "", isActive: true };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/members", { params: { search, page, limit: 8 } });
      setMembers(data.members);
      setPages(data.pages || 1);
    } catch (err) {
      setError(errMsg(err));
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(empty);
    setError("");
  };

  const openEdit = (m) => {
    setEditingId(m._id);
    setForm({ name: m.name, email: m.email, phone: m.phone || "", isActive: m.isActive });
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) await api.put(`/members/${editingId}`, form);
      else await api.post("/members", form);
      setForm(null);
      setEditingId(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete member "${m.name}"?`)) return;
    try {
      await api.delete(`/members/${m._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <h2>Members</h2>
      <div className="toolbar">
        <input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="spacer" />
        <button className="btn" onClick={openAdd}>+ Add member</button>
      </div>

      {form && (
        <form className="card" onSubmit={save}>
          <h3>{editingId ? "Edit member" : "Add member"}</h3>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {editingId && (
              <div>
                <label>Status</label>
                <select
                  value={String(form.isActive)}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="actions">
            <button className="btn">Save</button>
            <button type="button" className="btn secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m._id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.phone}</td>
                <td>
                  <span className={`badge ${m.isActive ? "green" : "red"}`}>
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn small secondary" onClick={() => openEdit(m)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(m)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan="5">No members found.</td></tr>
            )}
          </tbody>
        </table>
        <div className="pager">
          <button className="btn small secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn small secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </>
  );
}