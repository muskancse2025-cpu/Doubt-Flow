import { useState } from "react";
import api from "../api/axios";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ name: "", enrollment: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.enrollment.trim() || !form.phone.trim()) {
      return setError("All fields are required.");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("user", JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <aside className="login-aside">
          <div className="login-brand">
            <span className="brand-mark">D</span>
            <span>DoubtFlow</span>
          </div>
          <div className="login-illustration" aria-hidden="true">
            <span className="chat-bubble bubble-one">?</span>
            <span className="chat-bubble bubble-two">✓</span>
            <span className="chat-bubble bubble-three">#</span>
          </div>
          <h1>Ask freely.<br />Learn openly.</h1>
          <p>Share classroom doubts anonymously and get answers from your teacher and peers.</p>
        </aside>

        <div className="login-form-side">
          <div className="login-mobile-brand">
            <span className="brand-mark">D</span>
            <span>DoubtFlow</span>
          </div>
          <div className="login-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Enter the classroom</h2>
            <p>Use your enrollment details to continue.</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handle} placeholder="Your name" autoComplete="name" />
            </div>
            <div className="form-group">
              <label>Enrollment No.</label>
              <input type="text" name="enrollment" value={form.enrollment} onChange={handle} placeholder="e.g. CS2024001" autoComplete="username" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="10-digit mobile number" autoComplete="tel" />
            </div>
            <button className="btn btn-primary login-submit" disabled={loading}>
              {loading ? "Signing in…" : "Continue to DoubtFlow"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="teacher-hint">
            <span>Teacher access</span>
            <strong>Enrollment: TEACHER001</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
