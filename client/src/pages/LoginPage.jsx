import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const LoginPage = ({ adminMode = false }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", form);
      if (adminMode && data.user.role !== "admin") {
        setError("This account is not an admin account.");
        return;
      }
      login(data.token, data.user);
      const fallback = adminMode ? "/admin" : "/";
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel form-panel">
      <h1>{adminMode ? "Admin Login" : "Welcome Back"}</h1>
      <p className="sub">Use your account to continue booking live train tickets.</p>
      <form onSubmit={handleSubmit} className="grid-form">
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button disabled={loading} type="submit" className="primary-btn">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      {!adminMode && (
        <p className="muted-line">
          New user? <Link to="/register">Create an account</Link>
        </p>
      )}
    </section>
  );
};

export default LoginPage;
