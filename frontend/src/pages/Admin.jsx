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
    if (selectedBranches.length === 0 || selectedSemesters.length === 0) {
      setSubjects([]);
      setSelectedSubjects([]);
      return;
    }

    Promise.all(
      selectedBranches.flatMap((branchId) =>
        selectedSemesters.map((sem) =>
          client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`)
        )
      )
    ).then((res) => {
      const merged = res.flatMap((r) => r.data);

      // A subject can exist in multiple selected semesters. Select it by
      // name so the backend applies it to every selected branch × semester.
      const uniqueByName = Array.from(
        new Map(
          merged.map((s) => [
            String(s.name || "").trim().toLowerCase(),
            s,
          ])
        ).values()
      ).filter((s) => s.name?.trim());

      setSubjects(uniqueByName);
      setSelectedSubjects((current) =>
        current.filter((id) => uniqueByName.some((s) => s.id === id))
      );
    }).catch(() => {
      setSubjects([]);
      setSelectedSubjects([]);
    });
  }, [selectedBranches, selectedSemesters]);

  const getSelectedSubjectNames = () => {
    const selectedIds = new Set(selectedSubjects);

    return Array.from(
      new Set(
        subjects
          .filter((subject) => selectedIds.has(subject.id))
          .map((subject) => subject.name.trim())
          .filter(Boolean)
      )
    );
  };

  const buildPayload = (dryRun) => ({
    college_ids: selectedColleges,
    new_college: newCollegeName.trim()
      ? {
          name: newCollegeName.trim(),
          university: newCollegeUniversity.trim(),
        }
      : null,
    branch_ids: selectedBranches,
    new_branch_names: newBranchNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean),
    semesters: selectedSemesters.map(Number),

    // Existing subjects are sent by name, not by one particular ID.
    subject_ids: [],
    existing_subject_names: getSelectedSubjectNames(),

    new_subject_names: newSubjectNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean),

    unit_names: unitNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean),

    dry_run: dryRun,
  });

  const hasAnything = () => {
    const p = buildPayload(true);

    return Boolean(
      p.college_ids.length ||
      p.new_college ||
      p.branch_ids.length ||
      p.new_branch_names.length ||
      p.semesters.length ||
      p.existing_subject_names.length ||
      p.new_subject_names.length ||
      p.unit_names.length
    );
  };

  const runPreview = async () => {
    if (!hasAnything()) { setResult("Nothing selected yet — pick or create at least a college."); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await client.post("/admin/bulk-structure", buildPayload(true));
      setPreview(data);
    } catch (err) {
      setResult(err.response?.data?.detail || "Preview failed.");
    } finally { setBusy(false); }
  };

  const confirmCreate = async () => {
    setBusy(true);

    try {
      const { data } = await client.post(
        "/admin/bulk-structure",
        buildPayload(false)
      );

      setResult(
        `Colleges: +${data.colleges.created} new / ${data.colleges.reused} reused\n` +
        `Branches: +${data.branches.created} new / ${data.branches.reused} reused\n` +
        `Semesters selected: ${data.semesters.selected}\n` +
        `Subjects: +${data.subjects.created} new / ${data.subjects.reused} reused\n` +
        `Units: +${data.units.created} new / ${data.units.reused} reused`
      );

      setPreview(null);
      setNewCollegeName("");
      setNewCollegeUniversity("");
      setNewBranchNames("");
      setNewSubjectNames("");
      setUnitNames("");

      await loadColleges();

      if (selectedBranches.length && selectedSemesters.length) {
        const res = await Promise.all(
          selectedBranches.flatMap((branchId) =>
            selectedSemesters.map((sem) =>
              client.get(`/subjects/?branch_id=${branchId}&semester=${sem}`)
            )
          )
        );

        const merged = res.flatMap((r) => r.data);
        const uniqueByName = Array.from(
          new Map(
            merged.map((s) => [
              String(s.name || "").trim().toLowerCase(),
              s,
            ])
          ).values()
        ).filter((s) => s.name?.trim());

        setSubjects(uniqueByName);
      }
    } catch (err) {
      setResult(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setBusy(false);
    }
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
          <p>Branches: {preview.branches.created} new, {preview.branches.reused} existing</p>
          <p>Semesters selected: {preview.semesters.selected}</p>
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
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [semester, setSemester] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [type, setType] = useState("notes");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { client.get("/colleges/").then(({ data }) => setColleges(data)); }, []);
  useEffect(() => {
    if (!collegeId) { setBranches([]); setSelectedBranches([]); return; }
    client.get(`/branches/?college_id=${collegeId}`).then(({ data }) => setBranches(data));
  }, [collegeId]);

  const buildPayload = (dryRun) => ({
    branch_ids: selectedBranches,
    semesters: semester ? [Number(semester)] : [],
    subject_name: subjectName.trim(),
    unit_name: unitName.trim(),
    type,
    title: title.trim(),
    url: url.trim(),
    dry_run: dryRun,
  });

  const canSubmit = selectedBranches.length && semester && subjectName.trim() && unitName.trim() && title.trim() && url.trim();

  const runPreview = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await client.post("/admin/bulk-resource", buildPayload(true));
      setPreview(data);
    } catch (err) {
      setResult(err.response?.data?.detail || "Preview failed.");
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
      setResult(err.response?.data?.detail || "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ maxWidth: "none" }}>
      <h3 style={{ marginBottom: 4 }}>Scope</h3>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>Select every branch this resource applies to — one attach covers all of them.</p>

      <div className="field">
        <label>College</label>
        <select style={selectStyle} value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Select college</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
        <label>Semester</label>
        <select style={selectStyle} value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!collegeId}>
          <option value="">Select semester</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <div className="field"><label>Subject name (exact match, e.g. "Data Structures")</label><input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} /></div>
      <div className="field"><label>Unit name (exact match, e.g. "Arrays")</label><input value={unitName} onChange={(e) => setUnitName(e.target.value)} /></div>

      <hr className="admin-divider" />

      <h3 style={{ marginBottom: 16 }}>Resource</h3>
      <div className="field">
        <label>Type</label>
        <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="notes">Notes</option>
          <option value="playlist">Playlist</option>
          <option value="books">Books</option>
          <option value="pyq">PYQ</option>
        </select>
      </div>
      <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} /></div>

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
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [resources, setResources] = useState([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const loadColleges = () => client.get("/colleges/").then(({ data }) => setColleges(data));
  useEffect(() => { loadColleges(); }, []);

  const loadBranches = (cId) => client.get(`/branches/?college_id=${cId}`).then(({ data }) => setBranches(data));
  useEffect(() => {
    if (!collegeId) { setBranches([]); setBranchId(""); return; }
    loadBranches(collegeId);
  }, [collegeId]);

  const loadSubjects = (bId, sem) => client.get(`/subjects/?branch_id=${bId}&semester=${sem}`).then(({ data }) => setSubjects(data));
  useEffect(() => {
    if (!branchId || !semester) { setSubjects([]); setSubjectId(""); return; }
    loadSubjects(branchId, semester);
  }, [branchId, semester]);

  const loadUnits = (subId) => client.get(`/units/?subject_id=${subId}`).then(({ data }) => setUnits(data));
  useEffect(() => {
    if (!subjectId) { setUnits([]); setUnitId(""); return; }
    loadUnits(subjectId);
  }, [subjectId]);

  useEffect(() => {
    if (!unitId) { setDescription(""); setResources([]); return; }
    client.get(`/units/${unitId}`).then(({ data }) => setDescription(data.description || ""));
    client.get(`/resources/?unit_id=${unitId}`).then(({ data }) => setResources(data));
  }, [unitId]);

  const confirmAnd = (msg, fn) => {
    if (window.confirm(msg)) fn();
  };

  const deleteCollege = () => confirmAnd(
    "Delete this college and EVERYTHING under it (branches, subjects, units, resources)? This cannot be undone.",
    async () => {
      setBusy(true);
      await client.delete(`/colleges/${collegeId}`);
      setStatus("College deleted.");
      setCollegeId(""); setBranchId(""); setSubjectId(""); setUnitId("");
      loadColleges();
      setBusy(false);
    }
  );

  const deleteBranch = () => confirmAnd(
    "Delete this branch and everything under it (subjects, units, resources)?",
    async () => {
      setBusy(true);
      await client.delete(`/branches/${branchId}`);
      setStatus("Branch deleted.");
      setBranchId(""); setSubjectId(""); setUnitId("");
      loadBranches(collegeId);
      setBusy(false);
    }
  );

  const deleteSubject = () => confirmAnd(
    "Delete this subject and its units/resources?",
    async () => {
      setBusy(true);
      await client.delete(`/subjects/${subjectId}`);
      setStatus("Subject deleted.");
      setSubjectId(""); setUnitId("");
      loadSubjects(branchId, semester);
      setBusy(false);
    }
  );

  const deleteUnit = () => confirmAnd(
    "Delete this unit and all its resources?",
    async () => {
      setBusy(true);
      await client.delete(`/units/${unitId}`);
      setStatus("Unit deleted.");
      setUnitId("");
      loadUnits(subjectId);
      setBusy(false);
    }
  );

  const deleteResource = (resourceId, title) => confirmAnd(
    `Delete resource "${title}"?`,
    async () => {
      setBusy(true);
      await client.delete(`/resources/${resourceId}`);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      setStatus("Resource deleted.");
      setBusy(false);
    }
  );

  const saveSyllabus = async () => {
    setBusy(true);
    try {
      await client.patch(`/units/${unitId}`, { description });
      setStatus("Syllabus saved.");
    } catch (err) {
      setStatus(err.response?.data?.detail || "Failed to save.");
    } finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ maxWidth: "none" }}>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 16 }}>
        Navigate down to whatever you want to inspect, edit or remove. Deleting a level removes everything nested under it.
      </p>
      {status && <p style={{ color: "var(--accent-teal)", fontSize: 13, marginBottom: 16 }}>{status}</p>}

      <div className="field">
        <label>College</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={selectStyle} value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
            <option value="">Select college</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {collegeId && <button className="btn-ghost" onClick={deleteCollege} disabled={busy}>Delete</button>}
        </div>
      </div>

      <div className="field">
        <label>Branch</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={selectStyle} value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!collegeId}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {branchId && <button className="btn-ghost" onClick={deleteBranch} disabled={busy}>Delete</button>}
        </div>
      </div>

      <div className="field">
        <label>Semester</label>
        <select style={selectStyle} value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!branchId}>
          <option value="">Select semester</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Subject</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={selectStyle} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!semester}>
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {subjectId && <button className="btn-ghost" onClick={deleteSubject} disabled={busy}>Delete</button>}
        </div>
      </div>

      <div className="field">
        <label>Unit</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={selectStyle} value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!subjectId}>
            <option value="">Select unit</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {unitId && <button className="btn-ghost" onClick={deleteUnit} disabled={busy}>Delete</button>}
        </div>
      </div>

      {unitId && (
        <>
          <hr className="admin-divider" />

          <h3 style={{ marginBottom: 12 }}>Syllabus text</h3>
          <div className="field">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} style={{ ...selectStyle, resize: "vertical" }} />
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 20px", marginBottom: 24 }} onClick={saveSyllabus} disabled={busy}>
            Save syllabus
          </button>

          <hr className="admin-divider" />

          <h3 style={{ marginBottom: 12 }}>Resources in this unit</h3>
          {resources.length === 0 ? (
            <p className="empty-state">No resources yet.</p>
          ) : (
            <div className="checkbox-list">
              {resources.map((r) => (
                <div key={r.id} className="checkbox-item" style={{ justifyContent: "space-between" }}>
                  <span>[{r.type}] {r.title}</span>
                  <button className="link-muted" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-coral)" }} onClick={() => deleteResource(r.id, r.title)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}