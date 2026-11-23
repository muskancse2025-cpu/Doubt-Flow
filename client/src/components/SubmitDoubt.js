import { useState } from "react";
import api from "../api/axios";

export default function SubmitDoubt({ onSubmitted, addToast }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return addToast("Please write your doubt first.", "error");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("text", text.trim());
      fd.append("tags", tags.trim());
      if (image) fd.append("image", image);

      await api.post("/doubts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText(""); setTags(""); setImage(null); setPreview(null); setOpen(false);
      addToast("Doubt posted anonymously!", "success");
      onSubmitted();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to post doubt.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-panel">
      <div className="submit-toggle" onClick={() => setOpen((o) => !o)}>
        <div className="submit-toggle-copy">
          <span className="submit-icon" aria-hidden="true">＋</span>
          <div>
            <h3>Have a doubt?</h3>
            <p>Share it anonymously with the class</p>
          </div>
        </div>
        <span className="submit-expand">{open ? "Close" : "Post doubt"}</span>
      </div>

      {open && (
        <form className="submit-form" onSubmit={submit}>
          <div className="form-group">
            <label>Your Doubt</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your doubt clearly…"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Tags (optional, comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. math, calculus, integration"
            />
          </div>

          <div className="form-group">
            <label>Attach Image (optional)</label>
            <br />
            <label className="file-label" htmlFor="img-upload">
              📎 &nbsp;{image ? image.name : "Choose image (max 5MB)"}
            </label>
            <input
              id="img-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImage}
            />
            {preview && <img src={preview} alt="preview" className="file-preview" />}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Posting…" : "Post Anonymously"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setOpen(false); setText(""); setTags(""); setImage(null); setPreview(null); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
