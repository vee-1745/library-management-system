import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";

const empty = { title: "", author: "", isbn: "", genre: "", publishedYear: "", totalCopies: 1 };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/books", { params: { search, page, limit: 8 } });
      setBooks(data.books);
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

  const openEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      genre: b.genre || "",
      publishedYear: b.publishedYear || "",
      totalCopies: b.totalCopies,
    });
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      totalCopies: Number(form.totalCopies),
    };
    try {
      if (editingId) await api.put(`/books/${editingId}`, payload);
      else await api.post("/books", payload);
      setForm(null);
      setEditingId(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete "${b.title}"?`)) return;
    try {
      await api.delete(`/books/${b._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const field = (key, label, type = "text", extra = {}) => (
    <div>
      <label>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <>
      <h2>Books</h2>
      <div className="toolbar">
        <input
          placeholder="Search title, author, genre, ISBN..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="spacer" />
        <button className="btn" onClick={openAdd}>+ Add book</button>
      </div>

      {form && (
        <form className="card" onSubmit={save}>
          <h3>{editingId ? "Edit book" : "Add book"}</h3>
          <div className="form-grid">
            {field("title", "Title", "text", { required: true })}
            {field("author", "Author", "text", { required: true })}
            {field("isbn", "ISBN", "text", { required: true })}
            {field("genre", "Genre")}
            {field("publishedYear", "Published year", "number")}
            {field("totalCopies", "Total copies", "number", { min: 1, required: true })}
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
            <tr>
              <th>Title</th><th>Author</th><th>ISBN</th><th>Genre</th><th>Available</th><th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b._id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.isbn}</td>
                <td>{b.genre}</td>
                <td>
                  <span className={`badge ${b.availableCopies === 0 ? "red" : "green"}`}>
                    {b.availableCopies} / {b.totalCopies}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn small secondary" onClick={() => openEdit(b)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(b)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr><td colSpan="6">No books found.</td></tr>
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