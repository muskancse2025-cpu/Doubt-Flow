import { useState } from "react";
import Login from "./components/Login";
import Feed from "./components/Feed";
import Dashboard from "./components/Dashboard";
import { useToast, ToastContainer } from "./components/Toast";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [view, setView] = useState("feed");
  const { toasts, addToast } = useToast();

  const handleLogin = (userData) => {
    setUser(userData);
    setView(userData.role === "teacher" ? "dashboard" : "feed");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setView("feed");
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <nav className="nav">
        <button className="nav-brand" onClick={() => setView("feed")} aria-label="Open DoubtFlow feed">
          <span className="brand-mark">D</span>
          <span>DoubtFlow</span>
        </button>
        <div className="nav-right">
          {user.role === "teacher" && (
            <div className="nav-view-switch">
              <button
                className={`nav-view-btn${view === "feed" ? " active" : ""}`}
                onClick={() => setView("feed")}
              >
                Feed
              </button>
              <button
                className={`nav-view-btn${view === "dashboard" ? " active" : ""}`}
                onClick={() => setView("dashboard")}
              >
                Dashboard
              </button>
            </div>
          )}
          <span className="nav-user">
            {user.role === "teacher" ? user.name : "Universal User"}
          </span>
          <span className={`nav-role role-${user.role}`}>{user.role}</span>
          <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {view === "feed" && <Feed user={user} addToast={addToast} />}
        {view === "dashboard" && user.role === "teacher" && (
          <Dashboard user={user} addToast={addToast} />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
