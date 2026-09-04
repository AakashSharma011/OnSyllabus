import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import client from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";

const SEMESTERS = Array.from({ length: 8 }, (_, i) => i + 1);
const selectStyle = {
  width: "100%", padding: "12px 14px", background: "var(--bg-soft)",
  border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: 14,
};

function toggleIn(arr, id) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function extractError(err, fallback) {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  return fallback;
}

function CheckboxGrid({ items, selected, onToggle, labelKey = "name", onSelectAll, onClearAll }) {
  return (
    <div>
      {(onSelectAll || onClearAll) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {onSelectAll && <button type="button" className="link-muted" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onSelectAll}>Select all</button>}
          {onClearAll && <button type="button" className="link-muted" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={onClearAll}>Clear</button>}
        </div>
      )}
      {items.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>None yet.</p>
      ) : (
        <div className="checkbox-list">
          {items.map((item) => (
            <label key={item.id ?? item} className="checkbox-item">
              <input type="checkbox" checked={selected.includes(item.id ?? item)} onChange={() => onToggle(item.id ?? item)} />
              {typeof item === "object" ? item[labelKey] : item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/colleges" replace />;

  const [tab, setTab] = useState("structure");

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content" style={{ maxWidth: 720 }}>
        <span className="eyebrow">Admin</span>
        <h1 className="display browse-title">Content dashboard</h1>
        <p className="browse-subtitle">Build the academic tree in bulk, attach resources, or manage/delete existing content.</p>

        <div className="tab-bar">
          <button className={`tab-btn ${tab === "structure" ? "active" : ""}`} onClick={() => setTab("structure")}>Build structure</button>
          <button className={`tab-btn ${tab === "resources" ? "active" : ""}`} onClick={() => setTab("resources")}>Bulk resources</button>
          <button className={`tab-btn ${tab === "manage" ? "active" : ""}`} onClick={() => setTab("manage")}>Manage / Delete</button>
        </div>

        {tab === "structure" && <StructurePanel />}
        {tab === "resources" && <ResourcePanel />}
        {tab === "manage" && <ManagePanel />}
      </div>
      <Footer />
    </div>
  );
}

// ---------------- PANEL A: BUILD STRUCTURE ----------------

function StructurePanel() {
  const [colleges, setColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeUniversity, setNewCollegeUniversity] = useState("");

  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [newBranchNames, setNewBranchNames] = useState("");

  const [selectedSemesters, setSelectedSemesters] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [newSubjectNames, setNewSubjectNames] = useState("");

  const [unitNames, setUnitNames] = useState("");

  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const loadColleges = () => client.get("/colleges/").then(({ data }) => setColleges(data));
  useEffect(() => { loadColleges(); }, []);

  useEffect(() => {
    if (selectedColleges.length === 0) { setBranches([]); setSelectedBranches([]); return; }
    Promise.all(selectedColleges.map((id) => client.get(`/branches/?college_id=${id}`))).then((res) => {
      const merged = res.flatMap((r) => r.data);
      setBranches(Array.from(new Map(merged.map((b) => [b.id, b])).values()));
    });
  }, [selectedColleges]);

  useEffect(() => {
    if (selectedBranches.length === 0 || selectedSemesters.length === 0) { setSubjects([]); setSelectedSubjects([]); return; }
    Promise.all(
      selectedBranches.flatMap((branchId) =>
        selectedSemesters.map((sem) => client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`))
      )
    ).then((res) => {
      const merged = res.flatMap((r) => r.data);
      setSubjects(Array.from(new Map(merged.map((s) => [s.id, s])).values()));
    });
  }, [selectedBranches, selectedSemesters]);

  const buildPayload = (dryRun) => ({
    college_ids: selectedColleges,
    new_college: newCollegeName.trim() ? { name: newCollegeName.trim(), university: newCollegeUniversity.trim() } : null,
    branch_ids: selectedBranches,
    new_branch_names: newBranchNames.split(",").map((n) => n.trim()).filter(Boolean),
    semesters: selectedSemesters,
    subject_ids: selectedSubjects,
    new_subject_names: newSubjectNames.split(",").map((n) => n.trim()).filter(Boolean),
    unit_names: unitNames.split("\n").map((n) => n.trim()).filter(Boolean),
    dry_run: dryRun,
  });

  const hasAnything = () => {
    const p = buildPayload(true);
    return p.college_ids.length || p.new_college || p.branch_ids.length || p.new_branch_names.length || p.unit_names.length;
  };

  const runPreview = async () => {
    if (!hasAnything()) { setResult("Nothing selected yet — pick or create at least a college."); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await client.post("/admin/bulk-structure", buildPayload(true));
      setPreview(data);
    } catch (err) {
      setResult(extractError(err, "Preview failed."));
    } finally { setBusy(false); }
  };

  const confirmCreate = async () => {
    setBusy(true);
    try {
      const { data } = await client.post("/admin/bulk-structure", buildPayload(false));
      setResult(
        `Colleges: +${data.colleges.created} new / ${data.colleges.reused} reused\n` +
        `Branches: +${data.branches.created} new / ${data.branches.reused} reused\n` +
        `Semesters: +${data.semesters.created} new / ${data.semesters.reused} reused\n` +
        `Subjects: +${data.subjects.created} new / ${data.subjects.reused} reused\n` +
        `Units: +${data.units.created} new / ${data.units.reused} reused`
      );
      setPreview(null);
      setNewCollegeName(""); setNewCollegeUniversity(""); setNewBranchNames(""); setNewSubjectNames(""); setUnitNames("");
      loadColleges();
    } catch (err) {
      setResult(extractError(err, "Something went wrong."));
    } finally { setBusy(false); }
  };

  const buttonLabel = () => {
    if (unitNames.trim()) return "Preview: create units";
    if (newSubjectNames.trim() || selectedSubjects.length) return "Preview: create subjects";
    if (selectedSemesters.length) return "Preview: apply semesters";
    if (newBranchNames.trim() || selectedBranches.length) return "Preview: create branches";
    return "Preview: create college";
  };

  return (
    <div className="card" style={{ maxWidth: "none" }}>
      <h3 style={{ marginBottom: 4 }}>College</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>Select existing, or create a new one. Everything below is optional.</p>
      <CheckboxGrid items={colleges} selected={selectedColleges} onToggle={(id) => setSelectedColleges((p) => toggleIn(p, id))} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, marginBottom: 20 }}>
        <input value={newCollegeName} onChange={(e) => setNewCollegeName(e.target.value)} placeholder="New college name" />
        <input value={newCollegeUniversity} onChange={(e) => setNewCollegeUniversity(e.target.value)} placeholder="University" />
      </div>

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 4 }}>Branches</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>Applies to every college selected above.</p>
      <CheckboxGrid items={branches} selected={selectedBranches} onToggle={(id) => setSelectedBranches((p) => toggleIn(p, id))} />
      <input style={{ marginTop: 10, marginBottom: 20 }} value={newBranchNames} onChange={(e) => setNewBranchNames(e.target.value)} placeholder="New branches, comma separated: CSE, IT, ECE" />

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 4 }}>Semesters</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>Scope for subjects below — required if you're adding subjects.</p>
      <CheckboxGrid
        items={SEMESTERS}
        selected={selectedSemesters}
        onToggle={(s) => setSelectedSemesters((p) => toggleIn(p, s))}
        onSelectAll={() => setSelectedSemesters(SEMESTERS)}
        onClearAll={() => setSelectedSemesters([])}
      />

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 4 }}>Subjects</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>Applies to every branch × semester selected above.</p>
      <CheckboxGrid items={subjects} selected={selectedSubjects} onToggle={(id) => setSelectedSubjects((p) => toggleIn(p, id))} />
      <input style={{ marginTop: 10, marginBottom: 20 }} value={newSubjectNames} onChange={(e) => setNewSubjectNames(e.target.value)} placeholder="New subjects, comma separated: Data Structures, DBMS" />

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 4 }}>Units</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>One per line — applies to every subject selected/created above.</p>
      <textarea value={unitNames} onChange={(e) => setUnitNames(e.target.value)} rows={4} style={{ ...selectStyle, resize: "vertical" }} placeholder={"Introduction\nArrays\nLinked Lists"} />

      {preview && (
        <div className="preview-box">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>This will create/reuse:</p>
          <p>Colleges: {preview.colleges.created} new, {preview.colleges.reused} existing</p>
          <p>Semesters: {preview.semesters.created} new, {preview.semesters.reused} existing</p>
          <p>Branches: {preview.branches.created} new, {preview.branches.reused} existing</p>
          <p>Subjects: {preview.subjects.created} new, {preview.subjects.reused} existing</p>
          <p>Units: {preview.units.created} new, {preview.units.reused} existing</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 20px" }} onClick={confirmCreate} disabled={busy}>
              {busy ? "Creating..." : "Confirm & create"}
            </button>
            <button className="btn-ghost" onClick={() => setPreview(null)}>Cancel</button>
          </div>
        </div>
      )}

      {result && <p style={{ color: "var(--accent-teal)", fontSize: 13, marginTop: 16, whiteSpace: "pre-line" }}>{result}</p>}

      {!preview && (
        <button className="btn-primary" style={{ marginTop: 20 }} onClick={runPreview} disabled={busy}>
          {busy ? "Checking..." : buttonLabel()}
        </button>
      )}
    </div>
  );
}

// ---------------- PANEL B: BULK RESOURCES ----------------

function ResourcePanel() {
  const [colleges, setColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  const [selectedSemesters, setSelectedSemesters] = useState([]);

  const [subjectGroups, setSubjectGroups] = useState([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState("");

  const [unitGroups, setUnitGroups] = useState([]);
  const [selectedUnitKey, setSelectedUnitKey] = useState("");

  const [type, setType] = useState("notes");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploadMode, setUploadMode] = useState("url");
  const [uploading, setUploading] = useState(false);

  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { client.get("/colleges/").then(({ data }) => setColleges(data)); }, []);

  useEffect(() => {
    if (selectedColleges.length === 0) { setBranches([]); setSelectedBranches([]); return; }
    Promise.all(selectedColleges.map((id) => client.get(`/branches/?college_id=${id}`))).then((res) => {
      const merged = res.flatMap((r) => r.data);
      setBranches(Array.from(new Map(merged.map((b) => [b.id, b])).values()));
    });
  }, [selectedColleges]);

  useEffect(() => {
    if (selectedBranches.length === 0 || selectedSemesters.length === 0) {
      setSubjectGroups([]); setSelectedSubjectKey(""); return;
    }
    Promise.all(
      selectedBranches.map((branchId) =>
        Promise.all(selectedSemesters.map((sem) => client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`)))
          .then((resArr) => resArr.flatMap((r) => r.data))
      )
    ).then((perBranchSubjects) => {
      const nameSets = perBranchSubjects.map((subs) => new Set(subs.map((s) => s.name.trim().toLowerCase())));
      const commonNames = nameSets.length ? [...nameSets[0]].filter((name) => nameSets.every((set) => set.has(name))) : [];
      const groups = commonNames.map((name) => ({
        key: name,
        name: perBranchSubjects.flat().find((s) => s.name.trim().toLowerCase() === name)?.name || name,
      }));
      setSubjectGroups(groups);
      setSelectedSubjectKey("");
    });
  }, [selectedBranches, selectedSemesters]);

  useEffect(() => {
    if (!selectedSubjectKey || selectedBranches.length === 0 || selectedSemesters.length === 0) {
      setUnitGroups([]); setSelectedUnitKey(""); return;
    }
    Promise.all(
      selectedBranches.map((branchId) =>
        Promise.all(selectedSemesters.map((sem) => client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`)))
          .then((resArr) => resArr.flatMap((r) => r.data))
          .then((subs) => subs.find((s) => s.name.trim().toLowerCase() === selectedSubjectKey))
          .then((subject) => (subject ? client.get(`/units/?subject_id=${subject.id}`) : { data: [] }))
      )
    ).then((res) => {
      const perBranchUnits = res.map((r) => r.data);
      const nameSets = perBranchUnits.map((units) => new Set(units.map((u) => u.name.trim().toLowerCase())));
      const commonNames = nameSets.length ? [...nameSets[0]].filter((name) => nameSets.every((set) => set.has(name))) : [];
      const groups = commonNames.map((name) => ({
        key: name,
        name: perBranchUnits.flat().find((u) => u.name.trim().toLowerCase() === name)?.name || name,
      }));
      setUnitGroups(groups);
      setSelectedUnitKey("");
    });
  }, [selectedSubjectKey, selectedBranches, selectedSemesters]);

  const buildPayload = (dryRun) => ({
    branch_ids: selectedBranches,
    semester: selectedSemesters[0],
    subject_name: selectedSubjectKey,
    unit_name: selectedUnitKey,
    type, title, url,
    dry_run: dryRun,
  });

  const canSubmit = selectedBranches.length && selectedSemesters.length === 1 && selectedSubjectKey && selectedUnitKey && title.trim() && url.trim();

  const runPreview = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await client.post("/admin/bulk-resource", buildPayload(true));
      setPreview(data);
    } catch (err) {
      setResult(extractError(err, "Preview failed."));
    } finally { setBusy(false); }
  };

  const confirmAttach = async () => {
    setBusy(true);
    try {
      const { data } = await client.post("/admin/bulk-resource", buildPayload(false));
      setResult(`Attached to ${data.created} unit(s). ${data.already_attached} already had this resource.`);
      setPreview(null);
      setTitle(""); setUrl("");
    } catch (err) {
      setResult(extractError(err, "Something went wrong."));
    } finally { setBusy(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await client.post("/resources/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(data.url);
    } catch (err) {
      alert(extractError(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: "none" }}>
      <h3 style={{ marginBottom: 4 }}>Scope</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
        Select multiple branches to attach to matching (common) subject + unit across all of them.
      </p>

      <div className="field">
        <label>Colleges</label>
        <CheckboxGrid
          items={colleges}
          selected={selectedColleges}
          onToggle={(id) => setSelectedColleges((p) => toggleIn(p, id))}
          onSelectAll={() => setSelectedColleges(colleges.map((c) => c.id))}
          onClearAll={() => setSelectedColleges([])}
        />
      </div>

      <div className="field">
        <label>Branches</label>
        <CheckboxGrid
          items={branches}
          selected={selectedBranches}
          onToggle={(id) => setSelectedBranches((p) => toggleIn(p, id))}
          onSelectAll={() => setSelectedBranches(branches.map((b) => b.id))}
          onClearAll={() => setSelectedBranches([])}
        />
      </div>

      <div className="field">
        <label>Semester (select exactly one)</label>
        <CheckboxGrid
          items={SEMESTERS}
          selected={selectedSemesters}
          onToggle={(s) => setSelectedSemesters((p) => (p.includes(s) ? [] : [s]))}
        />
      </div>

      <div className="field">
        <label>Subject {selectedBranches.length > 1 ? "(common to all selected branches)" : ""}</label>
        <select style={selectStyle} value={selectedSubjectKey} onChange={(e) => setSelectedSubjectKey(e.target.value)} disabled={subjectGroups.length === 0}>
          <option value="">Select subject</option>
          {subjectGroups.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Unit {selectedBranches.length > 1 ? "(common to all selected branches)" : ""}</label>
        <select style={selectStyle} value={selectedUnitKey} onChange={(e) => setSelectedUnitKey(e.target.value)} disabled={unitGroups.length === 0}>
          <option value="">Select unit</option>
          {unitGroups.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
        </select>
      </div>

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 16 }}>Resource</h3>
      <div className="field">
        <label>Type</label>
        <select style={selectStyle} value={type} onChange={(e) => { setType(e.target.value); setUrl(""); }}>
          <option value="notes">Notes</option>
          <option value="playlist">Playlist</option>
          <option value="books">Books</option>
          <option value="pyq">PYQ</option>
        </select>
      </div>
      <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>

      {type === "notes" && (
        <div className="field">
          <label>Source</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button type="button" className={uploadMode === "url" ? "btn-primary" : "btn-ghost"} style={{ width: "auto", padding: "8px 16px" }} onClick={() => setUploadMode("url")}>Paste link</button>
            <button type="button" className={uploadMode === "file" ? "btn-primary" : "btn-ghost"} style={{ width: "auto", padding: "8px 16px" }} onClick={() => setUploadMode("file")}>Upload PDF</button>
          </div>
        </div>
      )}

      {(type !== "notes" || uploadMode === "url") && (
        <div className="field"><label>URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} /></div>
      )}

      {type === "notes" && uploadMode === "file" && (
        <div className="field">
          <label>PDF file (max 20MB)</label>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} />
          {uploading && <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>Uploading...</p>}
          {url && !uploading && <p style={{ fontSize: 12.5, color: "var(--accent-teal)", marginTop: 6 }}>File uploaded ✓</p>}
        </div>
      )}

      {preview && (
        <div className="preview-box">
          <p>Matched units: {preview.matched_units}</p>
          <p>Will attach to: {preview.will_create}</p>
          <p>Already attached: {preview.already_attached}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 20px" }} onClick={confirmAttach} disabled={busy || preview.will_create === 0}>
              {busy ? "Attaching..." : `Attach to ${preview.will_create} unit(s)`}
            </button>
            <button className="btn-ghost" onClick={() => setPreview(null)}>Cancel</button>
          </div>
        </div>
      )}

      {result && <p style={{ color: "var(--accent-teal)", fontSize: 13, marginTop: 16 }}>{result}</p>}

      {!preview && (
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={runPreview} disabled={!canSubmit || busy}>
          {busy ? "Checking..." : "Preview matching units"}
        </button>
      )}
    </div>
  );
}

// ---------------- PANEL C: MANAGE / DELETE + SYLLABUS EDIT ----------------

function ManagePanel() {
  const [colleges, setColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  const [selectedSemesters, setSelectedSemesters] = useState([]);

  const [subjectGroups, setSubjectGroups] = useState([]);
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState([]);

  const [unitGroups, setUnitGroups] = useState([]);
  const [selectedUnitKeys, setSelectedUnitKeys] = useState([]);

  const [description, setDescription] = useState("");
  const [resources, setResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);

  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const loadColleges = () => client.get("/colleges/").then(({ data }) => setColleges(data));
  useEffect(() => { loadColleges(); }, []);

  useEffect(() => {
    if (selectedColleges.length === 0) { setBranches([]); setSelectedBranches([]); return; }
    Promise.all(selectedColleges.map((id) => client.get(`/branches/?college_id=${id}`))).then((res) => {
      const merged = res.flatMap((r) => r.data);
      setBranches(Array.from(new Map(merged.map((b) => [b.id, b])).values()));
    });
  }, [selectedColleges]);

  useEffect(() => {
    if (selectedBranches.length === 0 || selectedSemesters.length === 0) {
      setSubjectGroups([]); setSelectedSubjectKeys([]); return;
    }
    Promise.all(
      selectedBranches.map((branchId) =>
        Promise.all(selectedSemesters.map((sem) => client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`)))
          .then((resArr) => resArr.flatMap((r) => r.data))
      )
    ).then((perBranchSubjects) => {
      const nameSets = perBranchSubjects.map((subs) => new Set(subs.map((s) => s.name.trim().toLowerCase())));
      const commonNames = nameSets.length ? [...nameSets[0]].filter((name) => nameSets.every((set) => set.has(name))) : [];
      const groups = commonNames.map((name) => {
        const ids = perBranchSubjects.flatMap((subs) => subs.filter((s) => s.name.trim().toLowerCase() === name).map((s) => s.id));
        const displayName = perBranchSubjects.flat().find((s) => s.name.trim().toLowerCase() === name)?.name || name;
        return { key: name, name: displayName, ids };
      });
      setSubjectGroups(groups);
      setSelectedSubjectKeys([]);
    });
  }, [selectedBranches, selectedSemesters]);

  useEffect(() => {
    const subjectIds = subjectGroups.filter((g) => selectedSubjectKeys.includes(g.key)).flatMap((g) => g.ids);
    if (subjectIds.length === 0) { setUnitGroups([]); setSelectedUnitKeys([]); return; }

    Promise.all(subjectIds.map((id) => client.get(`/units/?subject_id=${id}`))).then((res) => {
      const perSubjectUnits = res.map((r) => r.data);
      const nameSets = perSubjectUnits.map((units) => new Set(units.map((u) => u.name.trim().toLowerCase())));
      const commonNames = nameSets.length ? [...nameSets[0]].filter((name) => nameSets.every((set) => set.has(name))) : [];
      const groups = commonNames.map((name) => {
        const ids = perSubjectUnits.flatMap((units) => units.filter((u) => u.name.trim().toLowerCase() === name).map((u) => u.id));
        const displayName = perSubjectUnits.flat().find((u) => u.name.trim().toLowerCase() === name)?.name || name;
        return { key: name, name: displayName, ids };
      });
      setUnitGroups(groups);
      setSelectedUnitKeys([]);
    });
  }, [selectedSubjectKeys, subjectGroups]);

  const selectedUnitIds = () => unitGroups.filter((g) => selectedUnitKeys.includes(g.key)).flatMap((g) => g.ids);

  useEffect(() => {
    const unitIds = selectedUnitIds();
    if (unitIds.length === 0) { setDescription(""); setResources([]); setSelectedResources([]); return; }

    if (unitIds.length === 1) {
      client.get(`/units/${unitIds[0]}`).then(({ data }) => setDescription(data.description || ""));
    } else {
      setDescription("");
    }

    Promise.all(unitIds.map((id) => client.get(`/resources/?unit_id=${id}`))).then((res) => {
      setResources(res.flatMap((r) => r.data));
      setSelectedResources([]);
    });
  }, [selectedUnitKeys, unitGroups]);

  const notify = (msg) => setStatus(msg);

  const deleteIds = async (endpoint, ids, label) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} ${label}? This removes everything nested under them.`)) return;
    setBusy(true);
    for (const id of ids) {
      await client.delete(`${endpoint}/${id}`).catch(() => {});
    }
    setBusy(false);
    notify(`Deleted ${ids.length} ${label}.`);
  };

  const deleteSelectedColleges = async () => { await deleteIds("/colleges", selectedColleges, "college(s)"); setSelectedColleges([]); loadColleges(); };
  const deleteSelectedBranches = async () => { await deleteIds("/branches", selectedBranches, "branch(es)"); setSelectedBranches([]); };
  const deleteSelectedSubjects = async () => {
    const ids = subjectGroups.filter((g) => selectedSubjectKeys.includes(g.key)).flatMap((g) => g.ids);
    await deleteIds("/subjects", ids, "subject(s)"); setSelectedSubjectKeys([]);
  };
  const deleteSelectedUnits = async () => {
    await deleteIds("/units", selectedUnitIds(), "unit(s)"); setSelectedUnitKeys([]);
  };

  const saveSyllabus = async () => {
    const ids = selectedUnitIds();
    if (ids.length === 0) return;
    setBusy(true);
    try {
      for (const id of ids) {
        await client.patch(`/units/${id}`, { description }).catch(() => {});
      }
      notify(`Syllabus saved to ${ids.length} unit(s).`);
    } catch (err) {
      notify(extractError(err, "Failed to save."));
    } finally { setBusy(false); }
  };

  const deleteSelectedResources = async () => {
    if (selectedResources.length === 0) return;
    if (!window.confirm(`Delete ${selectedResources.length} resource(s)?`)) return;
    setBusy(true);
    for (const id of selectedResources) {
      await client.delete(`/resources/${id}`).catch(() => {});
    }
    setResources((prev) => prev.filter((r) => !selectedResources.includes(r.id)));
    setSelectedResources([]);
    notify("Resources deleted.");
    setBusy(false);
  };

  return (
    <div className="card" style={{ maxWidth: "none" }}>
      {status && <p style={{ color: "var(--accent-teal)", fontSize: 13, marginBottom: 16 }}>{status}</p>}

      <div className="field">
        <label>Colleges</label>
        <CheckboxGrid
          items={colleges}
          selected={selectedColleges}
          onToggle={(id) => setSelectedColleges((p) => toggleIn(p, id))}
          onSelectAll={() => setSelectedColleges(colleges.map((c) => c.id))}
          onClearAll={() => setSelectedColleges([])}
        />
        <button className="btn-ghost" style={{ marginTop: 10 }} disabled={busy || selectedColleges.length === 0} onClick={deleteSelectedColleges}>
          Delete selected colleges
        </button>
      </div>

      <hr className="admin-divider" />

      <div className="field">
        <label>Branches</label>
        <CheckboxGrid
          items={branches}
          selected={selectedBranches}
          onToggle={(id) => setSelectedBranches((p) => toggleIn(p, id))}
          onSelectAll={() => setSelectedBranches(branches.map((b) => b.id))}
          onClearAll={() => setSelectedBranches([])}
        />
        <button className="btn-ghost" style={{ marginTop: 10 }} disabled={busy || selectedBranches.length === 0} onClick={deleteSelectedBranches}>
          Delete selected branches
        </button>
      </div>

      <hr className="admin-divider" />

      <div className="field">
        <label>Semesters</label>
        <CheckboxGrid
          items={SEMESTERS}
          selected={selectedSemesters}
          onToggle={(s) => setSelectedSemesters((p) => toggleIn(p, s))}
          onSelectAll={() => setSelectedSemesters(SEMESTERS)}
          onClearAll={() => setSelectedSemesters([])}
        />
      </div>

      <hr className="admin-divider" />

      <div className="field">
        <label>Subjects</label>
        <CheckboxGrid
          items={subjectGroups.map((g) => ({ id: g.key, name: g.name }))}
          selected={selectedSubjectKeys}
          onToggle={(key) => setSelectedSubjectKeys((p) => toggleIn(p, key))}
          onSelectAll={() => setSelectedSubjectKeys(subjectGroups.map((g) => g.key))}
          onClearAll={() => setSelectedSubjectKeys([])}
        />
        <button className="btn-ghost" style={{ marginTop: 10 }} disabled={busy || selectedSubjectKeys.length === 0} onClick={deleteSelectedSubjects}>
          Delete selected subjects
        </button>
      </div>

      <hr className="admin-divider" />

      <div className="field">
        <label>Units</label>
        <CheckboxGrid
          items={unitGroups.map((g) => ({ id: g.key, name: g.name }))}
          selected={selectedUnitKeys}
          onToggle={(key) => setSelectedUnitKeys((p) => toggleIn(p, key))}
          onSelectAll={() => setSelectedUnitKeys(unitGroups.map((g) => g.key))}
          onClearAll={() => setSelectedUnitKeys([])}
        />
        <button className="btn-ghost" style={{ marginTop: 10 }} disabled={busy || selectedUnitKeys.length === 0} onClick={deleteSelectedUnits}>
          Delete selected units
        </button>
      </div>

      {selectedUnitIds().length > 0 && (
        <>
          <hr className="admin-divider" />
          <h3 style={{ marginBottom: 4 }}>Syllabus text</h3>
          {selectedUnitIds().length > 1 && (
            <p style={{ fontSize: 12.5, color: "var(--accent-amber)", marginBottom: 12 }}>
              Applies to all {selectedUnitIds().length} selected units at once — this will overwrite existing text in each.
            </p>
          )}
          <div className="field">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} style={{ ...selectStyle, resize: "vertical" }} />
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 20px", marginBottom: 24 }} onClick={saveSyllabus} disabled={busy}>
            Save syllabus {selectedUnitIds().length > 1 ? `to ${selectedUnitIds().length} units` : ""}
          </button>
        </>
      )}

      {selectedUnitIds().length > 0 && (
        <>
          <hr className="admin-divider" />
          <h3 style={{ marginBottom: 12 }}>Resources in selected unit(s)</h3>
          {resources.length === 0 ? (
            <p className="empty-state">No resources yet.</p>
          ) : (
            <>
              <CheckboxGrid
                items={resources.map((r) => ({ id: r.id, name: `[${r.type}] ${r.title}` }))}
                selected={selectedResources}
                onToggle={(id) => setSelectedResources((p) => toggleIn(p, id))}
                onSelectAll={() => setSelectedResources(resources.map((r) => r.id))}
                onClearAll={() => setSelectedResources([])}
              />
              <button className="btn-ghost" style={{ marginTop: 10 }} disabled={busy || selectedResources.length === 0} onClick={deleteSelectedResources}>
                Delete selected resources
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}