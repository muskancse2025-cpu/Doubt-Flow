import { useState, useEffect } from "react";
import api from "../api/axios";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard({ user, addToast }) {
  const [tab, setTab] = useState("doubts");
  const [doubts, setDoubts] = useState([]);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === "doubts") fetchDoubts();
    else fetchReports();
    // eslint-disable-next-line
  }, [tab, filter]);

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doubts?filter=${filter}`);
      setDoubts(data);
    } catch {
      addToast("Failed to load doubts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reports");
      setReports(data);
    } catch {
      addToast("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteDoubt = async (id) => {
    if (!window.confirm("Delete this doubt?")) return;
    try {
      await api.delete(`/doubts/${id}`);
      addToast("Doubt deleted.", "info");
      fetchDoubts();
    } catch {
      addToast("Failed to delete.", "error");
    }
  };

  const resolveDoubt = async (id) => {
    try {
      await api.patch(`/doubts/${id}/resolve`);
      addToast("Marked as resolved!", "success");
      fetchDoubts();
    } catch {
      addToast("Failed to resolve.", "error");
    }
  };

  const updateReport = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      addToast(`Report marked as ${status}.`, "success");
      fetchReports();
    } catch {
      addToast("Failed to update report.", "error");
    }
  };

  const blockUser = async (userId, userName) => {
    if (!window.confirm(`Block user ${userName}?`)) return;
    try {
      await api.patch(`/reports/block/${userId}`);
      addToast(`User ${userName} has been blocked.`, "success");
    } catch {
      addToast("Failed to block user.", "error");
    }
  };

  const stats = {
    total: doubts.length,
    resolved: doubts.filter((d) => d.isResolved).length,
    unresolved: doubts.filter((d) => !d.isResolved).length,
    pending: reports.filter((r) => r.status === "pending").length,
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Teacher Dashboard</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Manage doubts, verify answers, and review reports.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Doubts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unresolved}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Reports</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {["doubts", "reports"].map((t) => (
          <button
            key={t}
            className={`tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Doubts Tab */}
      {tab === "doubts" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "unresolved", "resolved"].map((f) => (
              <button
                key={f}
                className={`filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading && <div className="loader"><div className="spinner" /> Loading…</div>}

          {!loading && doubts.length === 0 && (
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>No doubts found.</p>
            </div>
          )}

          {!loading && doubts.map((d) => (
            <div key={d._id} className={`card${d.isResolved ? " resolved" : ""}`} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)",
                      background: "rgba(124,109,250,0.1)", padding: "2px 8px", borderRadius: 99,
                      border: "1px solid rgba(124,109,250,0.2)"
                    }}>
                      {d.authorName || "Unknown"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
                      {timeAgo(d.createdAt)}
                    </span>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 11, color: "var(--warning)",
                      background: "rgba(250,192,77,0.1)", padding: "2px 8px", borderRadius: 99,
                    }}>
                      ▲ {d.votes} votes
                    </span>
                    {d.isResolved && <span className="badge badge-resolved">✓ Resolved</span>}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)" }}>{d.text}</p>
                  {d.tags?.length > 0 && (
                    <div className="tags" style={{ marginTop: 8 }}>
                      {d.tags.map((t, i) => <span className="tag" key={i}>#{t}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {!d.isResolved && (
                  <button className="btn btn-verified btn-sm" onClick={() => resolveDoubt(d._id)}>
                    ✓ Resolve
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => deleteDoubt(d._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="card">
          {loading && <div className="loader"><div className="spinner" /> Loading…</div>}

          {!loading && reports.length === 0 && (
            <div className="empty-state">
              <div className="icon">🎉</div>
              <p>No reports submitted yet.</p>
            </div>
          )}

          {!loading && reports.map((r) => (
            <div key={r._id} className="report-row">
              <div className="report-content">
                <div className="report-label">
                  Reported by: {r.reportedBy?.name || "Unknown"} ({r.reportedBy?.enrollment || "—"})
                  &nbsp;·&nbsp; {timeAgo(r.createdAt)}
                </div>
                <div className="report-reason">{r.reason}</div>
                <div className="report-target">
                  {r.doubtId ? `Doubt: "${r.doubtId.text?.slice(0, 80)}…"` : ""}
                  {r.answerId ? `Answer: "${r.answerId.text?.slice(0, 80)}…"` : ""}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {r.status === "pending" && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => updateReport(r._id, "reviewed")}>
                        Mark Reviewed
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => updateReport(r._id, "dismissed")}>
                        Dismiss
                      </button>
                    </>
                  )}
                  {r.reportedBy?._id && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => blockUser(r.reportedBy._id, r.reportedBy.name)}
                    >
                      Block User
                    </button>
                  )}
                </div>
              </div>
              <span className={`status-badge status-${r.status}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
