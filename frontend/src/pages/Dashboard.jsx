import { useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";

const Stat = ({ label, value, warn }) => (
  <div className={`card stat ${warn ? "warn" : ""}`}>
    <div className="num">{value}</div>
    <div className="label">{label}</div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setStats(r.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const maxMonth = Math.max(1, ...stats.monthly.map((m) => m.issued));

  return (
    <>
      <h2>Dashboard</h2>
      <div className="grid">
        <Stat label="Book titles" value={stats.books.titles} />
        <Stat label="Total copies" value={stats.books.totalCopies} />
        <Stat label="Available copies" value={stats.books.availableCopies} />
        <Stat label="Currently issued" value={stats.transactions.currentlyIssued} />
        <Stat label="Overdue" value={stats.transactions.overdue} warn={stats.transactions.overdue > 0} />
        <Stat label="Active members" value={`${stats.members.active} / ${stats.members.total}`} />
        <Stat label="Fines collected" value={`₹${stats.fines.totalCollected}`} />
      </div>

      <div className="card">
        <h3>Most borrowed books</h3>
        {stats.topBooks.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Author</th><th>Times issued</th></tr>
            </thead>
            <tbody>
              {stats.topBooks.map((b) => (
                <tr key={b.bookId}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.timesIssued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Titles by genre</h3>
          {stats.genres.length === 0 && <p>No genres yet.</p>}
          {stats.genres.map((g) => (
            <div className="bar-row" key={g.genre}>
              <span className="label">{g.genre}</span>
              <span>{g.titles} titles / {g.copies} copies</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Books issued per month</h3>
          {stats.monthly.length === 0 && <p>No data yet.</p>}
          {stats.monthly.map((m) => (
            <div className="bar-row" key={m.month}>
              <span className="label">{m.month}</span>
              <div className="bar" style={{ width: `${(m.issued / maxMonth) * 200}px` }} />
              <span>{m.issued}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}