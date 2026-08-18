import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import client from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";

const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const SEMESTERS = Array.from({ length: 8 }, (_, i) => i + 1);

function Section({ title, children }) {
  return (
    <div className="card" style={{ maxWidth: "none", marginBottom: 24 }}>
      <h3 style={{ marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Admin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/colleges" replace />;

  const [status, setStatus] = useState("");
  const [colleges, setColleges] = useState([]);

  const loadColleges = () =>
    client.get("/colleges/").then(({ data }) => setColleges(data));

  useEffect(() => {
    loadColleges();
  }, []);

  const notify = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 3000);
  };

  const post = async (endpoint, payload, onDone) => {
    try {
      await client.post(endpoint, payload);
      notify("Added successfully.");
      onDone?.();
    } catch (err) {
      notify(err.response?.data?.detail || "Something went wrong.");
    }
  };

  return (
    <div className="browse-page">
      <Navbar />

      <div className="browse-content" style={{ maxWidth: 600 }}>
        <span className="eyebrow">Admin</span>

        <h1 className="display browse-title">Add content</h1>

        <p className="browse-subtitle">
          Build out the college → branch → semester → subject → unit → resource
          tree.
        </p>

        {status && (
          <p
            style={{
              color: "var(--accent-teal)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {status}
          </p>
        )}

        <Section title="New college">
          <CollegeForm post={post} onDone={loadColleges} />
        </Section>

        <Section title="New branch">
          <BranchForm post={post} colleges={colleges} />
        </Section>

        <Section title="New subject">
          <SubjectForm post={post} colleges={colleges} />
        </Section>

        <Section title="New unit">
          <UnitForm post={post} colleges={colleges} />
        </Section>

        <Section title="Bulk: add subject to multiple branches">
          <BulkSubjectForm colleges={colleges} />
        </Section>

        <Section title="Bulk: add units to multiple subjects">
          <BulkUnitForm colleges={colleges} />
        </Section>

        <Section title="New resource">
          <ResourceForm post={post} colleges={colleges} />
        </Section>

        <Section title="Bulk: add resource to matching subject+unit across branches">
          <BulkResourceForm colleges={colleges} />
        </Section>
      </div>

      <Footer />
    </div>
  );
}

function CollegeForm({ post, onDone }) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");

  return (
    <>
      <div className="field">
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>University</label>
        <input
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
        />
      </div>

      <button
        className="btn-primary"
        onClick={() =>
          post(
            "/colleges/",
            { name, university },
            () => {
              setName("");
              setUniversity("");
              onDone();
            }
          )
        }
      >
        Add college
      </button>
    </>
  );
}

function BranchForm({ post, colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [name, setName] = useState("");

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branch name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button
        className="btn-primary"
        onClick={() =>
          post(
            "/branches/",
            {
              name,
              college_id: collegeId,
            },
            () => setName("")
          )
        }
      >
        Add branch
      </button>
    </>
  );
}

function SubjectForm({ post, colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setBranchId("");
      return;
    }

    client
      .get(`/branches/?college_id=${collegeId}`)
      .then(({ data }) => setBranches(data));
  }, [collegeId]);

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branch</label>

        <select
          style={selectStyle}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={!collegeId}
        >
          <option value="">Select branch</option>

          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">Select semester</option>

          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subject name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button
        className="btn-primary"
        onClick={() =>
          post(
            "/subjects/",
            {
              name,
              semester: Number(semester),
              branch_id: branchId,
            },
            () => setName("")
          )
        }
      >
        Add subject
      </button>
    </>
  );
}

function UnitForm({ post, colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setBranchId("");
      return;
    }

    client
      .get(`/branches/?college_id=${collegeId}`)
      .then(({ data }) => setBranches(data));
  }, [collegeId]);

  useEffect(() => {
    if (!branchId || !semester) {
      setSubjects([]);
      setSubjectId("");
      return;
    }

    client
      .get(`/subjects/?branch_id=${branchId}&semester=${semester}`)
      .then(({ data }) => setSubjects(data));
  }, [branchId, semester]);

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branch</label>

        <select
          style={selectStyle}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={!collegeId}
        >
          <option value="">Select branch</option>

          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          disabled={!branchId}
        >
          <option value="">Select semester</option>

          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subject</label>

        <select
          style={selectStyle}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={!semester}
        >
          <option value="">Select subject</option>

          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Unit name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Order (1, 2, 3...)</label>

        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Syllabus text (shown in Syllabus tab)</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{
            ...selectStyle,
            resize: "vertical",
          }}
        />
      </div>

      <button
        className="btn-primary"
        onClick={() =>
          post(
            "/units/",
            {
              name,
              order_index: Number(orderIndex),
              subject_id: subjectId,
              description,
            },
            () => {
              setName("");
              setOrderIndex("");
              setDescription("");
            }
          )
        }
      >
        Add unit
      </button>
    </>
  );
}

function ResourceForm({ post, colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setBranchId("");
      return;
    }

    client
      .get(`/branches/?college_id=${collegeId}`)
      .then(({ data }) => setBranches(data));
  }, [collegeId]);

  useEffect(() => {
    if (!branchId || !semester) {
      setSubjects([]);
      setSubjectId("");
      return;
    }

    client
      .get(`/subjects/?branch_id=${branchId}&semester=${semester}`)
      .then(({ data }) => setSubjects(data));
  }, [branchId, semester]);

  useEffect(() => {
    if (!subjectId) {
      setUnits([]);
      setUnitId("");
      return;
    }

    client
      .get(`/units/?subject_id=${subjectId}`)
      .then(({ data }) => setUnits(data));
  }, [subjectId]);

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branch</label>

        <select
          style={selectStyle}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={!collegeId}
        >
          <option value="">Select branch</option>

          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          disabled={!branchId}
        >
          <option value="">Select semester</option>

          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subject</label>

        <select
          style={selectStyle}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={!semester}
        >
          <option value="">Select subject</option>

          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Unit</label>

        <select
          style={selectStyle}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          disabled={!subjectId}
        >
          <option value="">Select unit</option>

          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Type</label>

        <select
          style={selectStyle}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="video">Video</option>
          <option value="notes">Notes</option>
        </select>
      </div>

      <div className="field">
        <label>Title</label>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label>URL</label>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            type === "video"
              ? "YouTube link"
              : "Notes / PDF link"
          }
        />
      </div>

      <button
        className="btn-primary"
        onClick={() =>
          post(
            "/resources/",
            {
              unit_id: unitId,
              type,
              title,
              url,
            },
            () => {
              setTitle("");
              setUrl("");
            }
          )
        }
      >
        Add resource
      </button>
    </>
  );
}

function BulkSubjectForm({ colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [semester, setSemester] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setSelectedBranches([]);
      return;
    }

    client
      .get(`/branches/?college_id=${collegeId}`)
      .then(({ data }) => setBranches(data));
  }, [collegeId]);

  const toggleBranch = (id) => {
    setSelectedBranches((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id]
    );
  };

  const submitAll = async () => {
    setStatus("Adding...");

    for (const branchId of selectedBranches) {
      await client
        .post("/subjects/", {
          name,
          semester: Number(semester),
          branch_id: branchId,
        })
        .catch(() => {});
    }

    setStatus(
      `Added "${name}" to ${selectedBranches.length} branch(es).`
    );

    setName("");
  };

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branches (select all that apply)</label>

        <div className="checkbox-list">
          {branches.map((b) => (
            <label key={b.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedBranches.includes(b.id)}
                onChange={() => toggleBranch(b.id)}
              />

              {b.name}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">Select semester</option>

          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subject name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {status && (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--accent-teal)",
            marginBottom: 10,
          }}
        >
          {status}
        </p>
      )}

      <button
        className="btn-primary"
        onClick={submitAll}
        disabled={
          !name ||
          !semester ||
          selectedBranches.length === 0
        }
      >
        Add to {selectedBranches.length || 0} branch(es)
      </button>
    </>
  );
}

function BulkUnitForm({ colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [unitNames, setUnitNames] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setBranchId("");
      return;
    }

    client
      .get(`/branches/?college_id=${collegeId}`)
      .then(({ data }) => setBranches(data));
  }, [collegeId]);

  useEffect(() => {
    if (!branchId || !semester) {
      setSubjects([]);
      setSelectedSubjects([]);
      return;
    }

    client
      .get(`/subjects/?branch_id=${branchId}&semester=${semester}`)
      .then(({ data }) => setSubjects(data));
  }, [branchId, semester]);

  const toggleSubject = (id) => {
    setSelectedSubjects((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const submitAll = async () => {
    const names = unitNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    setStatus("Adding...");

    for (const subjectId of selectedSubjects) {
      for (let i = 0; i < names.length; i++) {
        await client
          .post("/units/", {
            name: names[i],
            order_index: i + 1,
            subject_id: subjectId,
          })
          .catch(() => {});
      }
    }

    setStatus(
      `Added ${names.length} unit(s) to ${selectedSubjects.length} subject(s).`
    );

    setUnitNames("");
  };

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
        >
          <option value="">Select college</option>

          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Branch</label>

        <select
          style={selectStyle}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={!collegeId}
        >
          <option value="">Select branch</option>

          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          disabled={!branchId}
        >
          <option value="">Select semester</option>

          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subjects (select all that apply)</label>

        <div className="checkbox-list">
          {subjects.map((s) => (
            <label key={s.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(s.id)}
                onChange={() => toggleSubject(s.id)}
              />

              {s.name}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Unit names (one per line, in order)</label>

        <textarea
          value={unitNames}
          onChange={(e) => setUnitNames(e.target.value)}
          rows={5}
          style={{
            ...selectStyle,
            resize: "vertical",
          }}
          placeholder={
            "Introduction\nArrays\nLinked Lists\nTrees"
          }
        />
      </div>

      {status && (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--accent-teal)",
            marginBottom: 10,
          }}
        >
          {status}
        </p>
      )}

      <button
        className="btn-primary"
        onClick={submitAll}
        disabled={
          !unitNames ||
          selectedSubjects.length === 0
        }
      >
        Add to {selectedSubjects.length || 0} subject(s)
      </button>
    </>
  );
}

function BulkResourceForm({ colleges }) {
  const [collegeId, setCollegeId] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [semester, setSemester] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [type, setType] = useState("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!collegeId) { setBranches([]); setSelectedBranches([]); return; }
    client.get(`/branches/?college_id=${collegeId}`).then(({ data }) => setBranches(data));
  }, [collegeId]);

  const toggleBranch = (id) => {
    setSelectedBranches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const submitAll = async () => {
    setStatus("Finding matching units...");
    let matchedUnitIds = [];

    for (const branchId of selectedBranches) {
      const { data: subjects } = await client.get(`/subjects/?branch_id=${branchId}&semester=${semester}`);
      const subject = subjects.find((s) => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase());
      if (!subject) continue;

      const { data: units } = await client.get(`/units/?subject_id=${subject.id}`);
      const unit = units.find((u) => u.name.trim().toLowerCase() === unitName.trim().toLowerCase());
      if (unit) matchedUnitIds.push(unit.id);
    }

    if (matchedUnitIds.length === 0) {
      setStatus("No matching subject/unit found in the selected branches. Check spelling matches exactly.");
      return;
    }

    setStatus(`Adding to ${matchedUnitIds.length} unit(s)...`);
    for (const unitId of matchedUnitIds) {
      await client.post("/resources/", { unit_id: unitId, type, title, url }).catch(() => {});
    }
    setStatus(`Added to ${matchedUnitIds.length} unit(s) successfully.`);
    setTitle(""); setUrl("");
  };

  return (
    <>
      <div className="field">
        <label>College</label>
        <select style={selectStyle} value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Select college</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Branches (select all that apply)</label>
        <div className="checkbox-list">
          {branches.map((b) => (
            <label key={b.id} className="checkbox-item">
              <input type="checkbox" checked={selectedBranches.includes(b.id)} onChange={() => toggleBranch(b.id)} />
              {b.name}
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Semester</label>
        <select style={selectStyle} value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!collegeId}>
          <option value="">Select semester</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Subject name (must match exactly across branches)</label>
        <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Applied Maths-I" />
      </div>
      <div className="field">
        <label>Unit name (must match exactly across branches)</label>
        <input value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="e.g. Matrices" />
      </div>
      <div className="field">
        <label>Type</label>
        <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="video">Video</option>
          <option value="notes">Notes</option>
        </select>
      </div>
      <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} /></div>
      {status && <p style={{ fontSize: 12.5, color: "var(--accent-teal)", marginBottom: 10 }}>{status}</p>}
      <button className="btn-primary" onClick={submitAll} disabled={!title || !url || selectedBranches.length === 0}>
        Add to matching units
      </button>
    </>
  );
}