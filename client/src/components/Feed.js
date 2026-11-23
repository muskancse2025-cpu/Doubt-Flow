import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import SubmitDoubt from "./SubmitDoubt";
import DoubtDetail from "./DoubtDetail";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Feed({ user, addToast }) {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState("all");
  const [selected, setSelected] = useState(null);

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doubts?filter=${filter}&scope=${scope}`);
      setDoubts(data);
    } catch {
      addToast("Failed to load doubts.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, scope, addToast]);

  useEffect(() => { fetchDoubts(); }, [fetchDoubts]);

  const handleVote = async (e, doubtId) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/doubts/${doubtId}/upvote`);
      setDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId ? { ...d, votes: data.votes, hasVoted: data.hasVoted } : d
        )
      );
    } catch {
      addToast("Failed to vote.", "error");
    }
  };

  return (
    <div>
      <SubmitDoubt onSubmitted={fetchDoubts} addToast={addToast} />

      <div className="feed-header">
        <h2 className="feed-title">{scope === "mine" ? "My Doubts" : "Doubt Feed"}</h2>
        <div className="feed-controls">
          {user.role !== "teacher" && (
            <div className="feed-filters scope-filters" aria-label="Doubt section">
              <button
                className={`filter-btn${scope === "all" ? " active" : ""}`}
                onClick={() => setScope("all")}
              >
                All Doubts
              </button>
              <button
                className={`filter-btn${scope === "mine" ? " active" : ""}`}
                onClick={() => setScope("mine")}
              >
                My Doubts
              </button>
            </div>
          )}
          <div className="feed-filters" aria-label="Doubt status">
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
        </div>
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner" /> Loading doubts…
        </div>
      )}

      {!loading && doubts.length === 0 && (
        <div className="empty-state">
          <div className="icon">🤔</div>
          <p>No doubts here yet. Be the first to ask!</p>
        </div>
      )}

      {!loading &&
        doubts.map((d) => (
          <div
            key={d._id}
            className={`doubt-card${d.isResolved ? " resolved" : ""}`}
            onClick={() => setSelected(d)}
          >
            <div className="doubt-header">
              <div className="doubt-meta">
                <span className="doubt-author">Universal User</span>
                <span className="doubt-time">{timeAgo(d.createdAt)}</span>
              </div>
              {d.isResolved && <span className="badge badge-resolved">✓ Resolved</span>}
            </div>

            {d.tags?.length > 0 && (
              <div className="tags">
                {d.tags.map((t, i) => <span className="tag" key={i}>#{t}</span>)}
              </div>
            )}

            <p className="doubt-text" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {d.text}
            </p>

            {d.imageUrl && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  fontFamily: "var(--mono)",
                }}
              >
                📎 Image attached
              </div>
            )}

            <div className="doubt-footer">
              <button
                className={`vote-btn${d.hasVoted ? " voted" : ""}`}
                onClick={(e) => handleVote(e, d._id)}
              >
                ▲ <span className="vote-count">{d.votes}</span>
              </button>
              <span className="badge badge-answers">
                💬 {d.answerCount || 0} answers
              </span>
            </div>
          </div>
        ))}

      {selected && (
        <DoubtDetail
          doubt={selected}
          user={user}
          onClose={() => setSelected(null)}
          addToast={addToast}
          onUpdate={fetchDoubts}
        />
      )}
    </div>
  );
}
