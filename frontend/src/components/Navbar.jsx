import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="brand">Library Management</span>
      <div className="links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/books">Books</NavLink>
        <NavLink to="/members">Members</NavLink>
        <NavLink to="/issue-return">Issue / Return</NavLink>
      </div>
      <div className="user">
        <span>{user?.name}</span>
        <button className="btn small secondary" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}