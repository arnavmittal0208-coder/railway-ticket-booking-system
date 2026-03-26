import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          CURAIL
        </Link>
        <nav className="nav-links">
          <NavLink to="/">Search</NavLink>
          <NavLink to="/enquiry/12951">Train Enquiry</NavLink>
          {isAuthenticated && <NavLink to="/history">My Bookings</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="auth-actions">
          {isAuthenticated ? (
            <>
              <span className="hello">Hi, {user?.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="cta-link">
                Register
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="content-wrap">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
