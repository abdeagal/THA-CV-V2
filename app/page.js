"use client";

import { useMemo, useState } from "react";
import { emptyCandidate, normaliseCandidate } from "./lib/schema";

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function ArrayEditor({ label, value, onChange, placeholder }) {
  const text = joinLines(value);
  return (
    <>
      <label>{label}</label>
      <textarea
        value={text}
        placeholder={placeholder || "One item per line"}
        onChange={(e) => onChange(splitLines(e.target.value))}
      />
    </>
  );
}

function CandidateEditor({ candidate, setCandidate }) {
  const update = (key, value) => setCandidate((prev) => ({ ...prev, [key]: value }));
  const updateJob = (index, key, value) => {
    setCandidate((prev) => {
      const experience = [...(prev.experience || [])];
      experience[index] = { ...experience[index], [key]: value };
      return { ...prev, experience };
    });
  };
  const addJob = () =>
    setCandidate((prev) => ({
      ...prev,
      experience: [...(prev.experience || []), { role: "", company: "", dates: "", bullets: [] }]
    }));
  const removeJob = (index) =>
    setCandidate((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));

  return (
    <div>
      <label>Name</label>
      <input type="text" value={candidate.name || ""} onChange={(e) => update("name", e.target.value)} />

      <label>Headline / Role</label>
      <input type="text" value={candidate.headline || ""} onChange={(e) => update("headline", e.target.value)} />

      <label>Profile</label>
      <textarea value={candidate.profile || ""} onChange={(e) => update("profile", e.target.value)} />

      <div className="small-row">
        <div>
          <label>Location</label>
          <input type="text" value={candidate.location || ""} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div>
          <label>Nationality</label>
          <input type="text" value={candidate.nationality || ""} onChange={(e) => update("nationality", e.target.value)} />
        </div>
      </div>

      <ArrayEditor label="Education" value={candidate.education} onChange={(v) => update("education", v)} />
      <ArrayEditor label="Languages" value={candidate.languages} onChange={(v) => update("languages", v)} />
      <ArrayEditor label="Accomplishments" value={candidate.accomplishments} onChange={(v) => update("accomplishments", v)} />
      <ArrayEditor label="Certifications" value={candidate.certifications} onChange={(v) => update("certifications", v)} />
      <ArrayEditor label="Proficiencies" value={candidate.proficiencies} onChange={(v) => update("proficiencies", v)} />

      <label>Work Experience</label>
      {(candidate.experience || []).map((job, index) => (
        <div className="job" key={index}>
          <div className="job-head">
            <input placeholder="Role" value={job.role || ""} onChange={(e) => updateJob(index, "role", e.target.value)} />
            <input placeholder="Dates" value={job.dates || ""} onChange={(e) => updateJob(index, "dates", e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <input placeholder="Company" value={job.company || ""} onChange={(e) => updateJob(index, "company", e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <textarea
              placeholder="Bullets — one per line"
              value={joinLines(job.bullets)}
              onChange={(e) => updateJob(index, "bullets", splitLines(e.target.value))}
            />
          </div>
          <button className="danger" type="button" onClick={() => removeJob(index)}>Remove role</button>
        </div>
      ))}
      <button className="secondary" type="button" onClick={addJob}>+ Add role</button>
    </div>
  );
}

function SideList({ title, items }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : items ? [items] : [];
  return (
    <div>
      <div className="side-title">{title}</div>
      {arr.length ? (
        <ul className="side-list">{arr.map((item, i) => <li key={i}>{item}</li>)}</ul>
      ) : (
        <div className="side-text">—</div>
      )}
    </div>
  );
}

function Preview({ candidate }) {
  const exp = candidate.experience || [];
  return (
    <div className="cv-page">
      <main className="cv-main">
        <div className="cv-name">{candidate.name || "Candidate Name"}</div>
        <div className="cv-profile">{candidate.profile || "Profile summary will appear here after extraction."}</div>
        <section className="cv-section">
          <div className="cv-section-title">Work. Experience</div>
          {exp.length ? exp.map((job, i) => (
            <div className="cv-job" key={i}>
              <div className="cv-job-title"><span>{job.role || "Role"}</span><span>{job.dates || ""}</span></div>
              <div className="cv-company">{job.company}</div>
              <ul className="cv-bullets">{(job.bullets || []).map((b, idx) => <li key={idx}>{b}</li>)}</ul>
            </div>
          )) : <p className="side-text">Experience will appear here.</p>}
        </section>
      </main>
      <aside className="cv-side">
        <div className="side-title">Location</div>
        <div className="side-text">{candidate.location || "—"}</div>
        <SideList title="Education" items={candidate.education} />
        <SideList title="Languages" items={candidate.languages} />
        <SideList title="Accomplishments" items={candidate.accomplishments} />
        <div className="side-title">Nationality</div>
        <div className="side-text">{candidate.nationality || "—"}</div>
        <SideList title="Certifications" items={candidate.certifications} />
        <SideList title="Proficiencies" items={candidate.proficiencies} />
      </aside>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [candidate, setCandidate] = useState(emptyCandidate);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const hasCandidate = useMemo(() => Boolean(candidate.name || candidate.profile || candidate.experience?.length), [candidate]);

  async function extract() {
    setError("");
    setWarning("");
    setLoading(true);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (text.trim()) form.append("text", text.trim());
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setCandidate(normaliseCandidate(data.candidate));
      if (data.warning) setWarning(data.warning);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateDocx() {
    setError("");
    setExporting(true);
    try {
      const res = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "DOCX generation failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(candidate.name || "Candidate").replace(/[^a-z0-9 -]/gi, "").replace(/\s+/g, "_")}_THA_CV.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div>
          <h1>THA CV Formatter Prototype</h1>
          <p>Upload or paste a raw CV. The app extracts candidate data, lets your team edit it, previews it in the THA-style two-column format, then exports a Word document.</p>
        </div>
        <div className="badge">Prototype • Vercel-ready</div>
      </div>

      <div className="grid">
        <section className="panel">
          <div className="panel-inner">
            <h2>1. Upload / paste CV</h2>
            <p className="help">PDF and DOCX are supported. For large PDFs, paste the CV text instead during prototype testing.</p>
            <div className="file">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <label>Or paste CV text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste raw CV text here..." />
            <div className="actions">
              <button className="primary" onClick={extract} disabled={loading}>{loading ? "Extracting..." : "Extract CV"}</button>
              <button className="secondary" onClick={() => setCandidate(emptyCandidate)}>Clear</button>
            </div>
            {error && <div className="error">{error}</div>}
            {warning && <div className="warn">{warning}</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-inner">
            <h2>2. Edit extracted profile</h2>
            <CandidateEditor candidate={candidate} setCandidate={setCandidate} />
            <div className="actions">
              <button className="primary" onClick={generateDocx} disabled={!hasCandidate || exporting}>{exporting ? "Generating..." : "Download THA-style DOCX"}</button>
              <button className="secondary" onClick={() => window.print()}>Print / Save preview as PDF</button>
            </div>
          </div>
          <div className="preview-wrap">
            <Preview candidate={candidate} />
          </div>
        </section>
      </div>
    </div>
  );
}
