import { useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong.");

      if (isRegister) {
        navigate("/login", { state: { notice: data.message } });
      } else {
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("authUser", JSON.stringify(data.user));
        navigate("/dashboard");
      }
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="intro-panel">
        <div className="brand"><span className="brand-mark">S</span> Securely</div>
        <div className="intro-copy">
          <span className="eyebrow">SIMPLE. PRIVATE. SECURE.</span>
          <h1>Your space.<br /><em>Your access.</em></h1>
          <p>A simple JWT authentication demo built with React and Express. Create an account, sign in, and visit your protected space.</p>
          <div className="security-note"><span className="lock-icon">⌑</span><span><b>Protected by JWT</b><small>Token-based access control</small></span></div>
        </div>
        <div className="panel-footer">TASK 36 · AUTHENTICATION</div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand"><span className="brand-mark">S</span> Securely</div>
        <div className="form-wrap">
          <span className="eyebrow muted">{isRegister ? "GET STARTED" : "WELCOME BACK"}</span>
          <h2>{isRegister ? "Create your account" : "Sign in to continue"}</h2>
          <p className="form-subtitle">{isRegister ? "A few details and you're all set." : "Enter your details to access your account."}</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="Enter your username" autoComplete="username" required minLength="3" />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" autoComplete={isRegister ? "new-password" : "current-password"} required minLength="6" />
            {message && <div className="alert error" role="alert">{message}</div>}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"} <span>→</span></button>
          </form>

          <p className="switch-copy">
            {isRegister ? "Already have an account?" : "New here?"}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? " Sign in" : " Create an account"}</Link>
          </p>
          <div className="form-bottom"><span>●</span> Your demo session is secured with JSON Web Tokens.</div>
        </div>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }) {
  return localStorage.getItem("jwtToken") ? children : <Navigate to="/login" replace />;
}

function Dashboard() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("authUser") || "{}");

  async function accessProtectedRoute() {
    setError("");
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/protected`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` }
      });
      const data = await response.json();
      if (!response.ok) {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("authUser");
        throw new Error(data.message || "Access denied.");
      }
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    }
  }

  function logout() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <Link className="brand dark-brand" to="/dashboard"><span className="brand-mark">S</span> Securely</Link>
        <button className="logout-button" onClick={logout}>Log out ↗</button>
      </nav>
      <section className="dashboard-content">
        <span className="eyebrow muted">YOUR PRIVATE SPACE</span>
        <h1>You're in, <em>{user.username || "there"}.</em></h1>
        <p className="dashboard-lead">Your account is signed in. Use the button below to make an authenticated request to the Express protected route.</p>
        <div className="welcome-card">
          <div className="welcome-icon">✓</div>
          <div><span className="card-label">AUTHENTICATION STATUS</span><h3>Signed in successfully</h3><p>Your JWT is saved in localStorage for this demo session.</p></div>
          <span className="status-pill">ACTIVE</span>
        </div>
        <button className="primary-button access-button" onClick={accessProtectedRoute}>Access protected route <span>→</span></button>
        {result && <div className="response-card success"><b>Protected route response</b><p>{result.message}</p><small>Authenticated as: {result.user.username}</small></div>}
        {error && <div className="alert error response-error">{error}</div>}
        <p className="dashboard-footnote">This page is protected on the frontend, and the API independently verifies your JWT on the backend.</p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}