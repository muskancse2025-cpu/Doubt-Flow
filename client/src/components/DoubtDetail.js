import { useState, useEffect } from "react";
import api from "../api/axios";

const BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DoubtDetail({ doubt: initialDoubt, user, onClose, addToast, onUpdate }) {
  const [doubt, setDoubt] = useState(initialDoubt);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(null); // { type, id }
  const [reportReason, setReportReason] = useState("");
  const isTeacher = user.role === "teacher";

  const REPORT_REASONS = [
    "Spam or irrelevant content",
    "Inappropriate or offensive",
    "Duplicate question",
    "Misleading information",
    "Other",
  ];

  useEffect(() => {
    fetchAnswers();
    // eslint-disable-next-line
  }, []);

  const fetchAnswers = async () => {
    setLoadingAnswers(true);
    try {
      const { data } = await api.get(`/answers/${doubt._id}`);
      setAnswers(data);
    } catch {
      addToast("Failed to load answers.", "error");
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleVote = async () => {
    try {
      const { data } = await api.post(`/doubts/${doubt._id}/upvote`);
      setDoubt((d) => ({ ...d, votes: data.votes, hasVoted: data.hasVoted }));
      onUpdate();
    } catch {
      addToast("Failed to vote.", "error");
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim()) return addToast("Answer cannot be empty.", "error");
    setSubmitting(true);
    try {
      await api.post(`/answers/${doubt._id}`, { text: answerText.trim() });
      setAnswerText("");
      addToast("Answer posted!", "success");
      fetchAnswers();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to post answer.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAnswer = async (answerId) => {
    try {
      await api.patch(`/answers/${answerId}/verify`);
      addToast("Answer verified!", "success");
      fetchAnswers();
    } catch {
      addToast("Failed to verify.", "error");
    }
  };

  const deleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await api.delete(`/answers/${answerId}`);
      addToast("Answer deleted.", "info");
      fetchAnswers();
    } catch {
      addToast("Failed to delete.", "error");
    }
  };

  const resolveDoubt = async () => {
    try {
      await api.patch(`/doubts/${doubt._id}/resolve`);
      setDoubt((d) => ({ ...d, isResolved: true }));
      addToast("Marked as resolved!", "success");
      onUpdate();
    } catch {
      addToast("Failed to resolve.", "error");
    }
  };

  const deleteDoubt = async () => {
    if (!window.confirm("Delete this doubt?")) return;
    try {
      await api.delete(`/doubts/${doubt._id}`);
      addToast("Doubt deleted.", "info");
      onUpdate();
      onClose();
    } catch {
      addToast("Failed to delete.", "error");
    }
  };

  const submitReport = async () => {
    if (!reportReason) return addToast("Select a reason.", "error");
    try {
      const payload = { reason: reportReason };
      if (reportOpen.type === "doubt") payload.doubtId = doubt._id;
      else payload.answerId = reportOpen.id;
      await api.post("/reports", payload);
      addToast("Report submitted.", "success");
      setReportOpen(null);
      setReportReason("");
    } catch {
      addToast("Failed to report.", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <div className="doubt-meta" style={{ marginBottom: 6 }}>
              <span className="doubt-author">Universal User</span>
              <span className="doubt-time">{timeAgo(doubt.createdAt)}</span>
              {doubt.isResolved && <span className="badge badge-resolved">✓ Resolved</span>}
            </div>
            <div className="doubt-text" style={{ marginBottom: 0 }}>{doubt.text}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Tags */}
          {doubt.tags?.length > 0 && (
            <div className="tags" style={{ marginBottom: 12 }}>
              {doubt.tags.map((t, i) => <span className="tag" key={i}>#{t}</span>)}
            </div>
          )}

          {/* Image */}
          {doubt.imageUrl && (
            <img
              src={`${BASE}${doubt.imageUrl}`}
              alt="doubt attachment"
              className="doubt-image"
            />
          )}

          {/* Actions row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <button className={`vote-btn${doubt.hasVoted ? " voted" : ""}`} onClick={handleVote}>
              ▲ <span className="vote-count">{doubt.votes}</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setReportOpen({ type: "doubt" })}>
              ⚑ Report
            </button>
            {isTeacher && (
              <>
                {!doubt.isResolved && (
                  <button className="btn btn-verified btn-sm" onClick={resolveDoubt}>✓ Mark Resolved</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={deleteDoubt}>🗑 Delete</button>
              </>
            )}
          </div>

          <div className="divider" />

          {/* Answers */}
          <div className="answers-section">
            <div className="answers-title">
              {loadingAnswers ? "Loading…" : `${answers.length} Answer${answers.length !== 1 ? "s" : ""}`}
            </div>

            {!loadingAnswers && answers.length === 0 && (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <p>No answers yet. Be the first!</p>
              </div>
            )}

            {answers.map((a) => (
              <div key={a._id} className={`answer-card${a.isVerified ? " verified" : ""}`}>
                <div className="answer-meta">
                  <span className="answer-author">Universal User</span>
                  <span className="doubt-time">{timeAgo(a.createdAt)}</span>
                  {a.isVerified && <span className="verified-badge">✓ Verified by Teacher</span>}
                </div>
                <div className="answer-text">{a.text}</div>
                <div className="answer-actions">
                  {isTeacher && !a.isVerified && (
                    <button className="btn btn-verified btn-sm" onClick={() => verifyAnswer(a._id)}>
                      ✓ Verify
                    </button>
                  )}
                  {isTeacher && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteAnswer(a._id)}>
                      Delete
                    </button>
                  )}
                  {!isTeacher && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setReportOpen({ type: "answer", id: a._id })}
                    >
                      ⚑ Report
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Answer input */}
            <div className="answer-form">
              <textarea
                className="answer-input"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer here…"
                rows={2}
              />
              <button className="btn btn-primary" onClick={submitAnswer} disabled={submitting}>
                {submitting ? "…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 300 }}
          onClick={(e) => e.target === e.currentTarget && setReportOpen(null)}
        >
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: "var(--display)", fontWeight: 700 }}>Report Content</h3>
              <button className="modal-close" onClick={() => setReportOpen(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                Why are you reporting this {reportOpen.type}?
              </p>
              <div className="report-reasons">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    className={`report-reason-btn${reportReason === r ? " selected" : ""}`}
                    onClick={() => setReportReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={submitReport}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
