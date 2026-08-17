import Footer from "../components/Footer.jsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import client from "../api/client.js";

export default function Admin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/colleges" replace />;
  }

  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);

  const [collegeForm, setCollegeForm] = useState({
    name: "",
    university: "",
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    college_id: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    semester: "",
    branch_id: "",
  });

  const [unitForm, setUnitForm] = useState({
    name: "",
    order_index: "",
    subject_id: "",
  });

  const [resourceForm, setResourceForm] = useState({
    title: "",
    url: "",
    type: "video",
    unit_id: "",
  });

  const [status, setStatus] = useState("");

  const loadColleges = () =>
    client
      .get("/colleges/")
      .then(({ data }) => setColleges(data));

  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    if (branchForm.college_id) {
      client
        .get(`/branches/?college_id=${branchForm.college_id}`)
        .then(({ data }) => setBranches(data));
    } else {
      setBranches([]);
    }
  }, [branchForm.college_id]);

  useEffect(() => {
    if (subjectForm.branch_id) {
      client
        .get(`/subjects/?branch_id=${subjectForm.branch_id}`)
        .then(({ data }) => setSubjects(data));
    } else {
      setSubjects([]);
    }
  }, [subjectForm.branch_id]);

  useEffect(() => {
    if (unitForm.subject_id) {
      client
        .get(`/units/?subject_id=${unitForm.subject_id}`)
        .then(({ data }) => setUnits(data));
    } else {
      setUnits([]);
    }
  }, [unitForm.subject_id]);

  const handleCreate = async (
    endpoint,
    payload,
    resetForm,
    onSuccess
  ) => {
    setStatus("");

    try {
      await client.post(endpoint, payload);

      setStatus("Added successfully.");
      resetForm();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setStatus(
        err.response?.data?.detail || "Something went wrong."
      );
    }
  };

  return (
    <div className="browse-page">
      <Navbar />

      <div
        className="browse-content"
        style={{ maxWidth: 600 }}
      >
        <h1 className="display browse-title">
          Add content
        </h1>

        <p className="browse-subtitle">
          Build out the college → branch → subject → unit → resource tree.
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

        {/* College */}
        <div
          className="card"
          style={{
            maxWidth: "none",
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            New college
          </h3>

          <div className="field">
            <label>Name</label>

            <input
              value={collegeForm.name}
              onChange={(e) =>
                setCollegeForm({
                  ...collegeForm,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>University</label>

            <input
              value={collegeForm.university}
              onChange={(e) =>
                setCollegeForm({
                  ...collegeForm,
                  university: e.target.value,
                })
              }
            />
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              handleCreate(
                "/colleges/",
                collegeForm,
                () =>
                  setCollegeForm({
                    name: "",
                    university: "",
                  }),
                loadColleges
              )
            }
          >
            Add college
          </button>
        </div>

        {/* Branch */}
        <div
          className="card"
          style={{
            maxWidth: "none",
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            New branch
          </h3>

          <div className="field">
            <label>College</label>

            <select
              value={branchForm.college_id}
              onChange={(e) =>
                setBranchForm({
                  ...branchForm,
                  college_id: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="">
                Select college
              </option>

              {colleges.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Branch name</label>

            <input
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({
                  ...branchForm,
                  name: e.target.value,
                })
              }
            />
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              handleCreate(
                "/branches/",
                branchForm,
                () =>
                  setBranchForm({
                    ...branchForm,
                    name: "",
                  })
              )
            }
          >
            Add branch
          </button>
        </div>

        {/* Subject */}
        <div
          className="card"
          style={{
            maxWidth: "none",
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            New subject
          </h3>

          <div className="field">
            <label>Branch</label>

            <select
              value={subjectForm.branch_id}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  branch_id: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="">
                Select branch
              </option>

              {branches.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                >
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Subject name</label>

            <input
              value={subjectForm.name}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>Semester</label>

            <input
              type="number"
              value={subjectForm.semester}
              onChange={(e) =>
                setSubjectForm({
                  ...subjectForm,
                  semester: e.target.value,
                })
              }
            />
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              handleCreate(
                "/subjects/",
                {
                  ...subjectForm,
                  semester: Number(subjectForm.semester),
                },
                () =>
                  setSubjectForm({
                    ...subjectForm,
                    name: "",
                    semester: "",
                  })
              )
            }
          >
            Add subject
          </button>
        </div>

        {/* Unit */}
        <div
          className="card"
          style={{
            maxWidth: "none",
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            New unit
          </h3>

          <div className="field">
            <label>Subject</label>

            <select
              value={unitForm.subject_id}
              onChange={(e) =>
                setUnitForm({
                  ...unitForm,
                  subject_id: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="">
                Select subject
              </option>

              {subjects.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Unit name</label>

            <input
              value={unitForm.name}
              onChange={(e) =>
                setUnitForm({
                  ...unitForm,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>Order (1, 2, 3...)</label>

            <input
              type="number"
              value={unitForm.order_index}
              onChange={(e) =>
                setUnitForm({
                  ...unitForm,
                  order_index: e.target.value,
                })
              }
            />
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              handleCreate(
                "/units/",
                {
                  ...unitForm,
                  order_index: Number(unitForm.order_index),
                },
                () =>
                  setUnitForm({
                    ...unitForm,
                    name: "",
                    order_index: "",
                  })
              )
            }
          >
            Add unit
          </button>
        </div>

        {/* Resource */}
        <div
          className="card"
          style={{
            maxWidth: "none",
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            New resource
          </h3>

          <div className="field">
            <label>Unit</label>

            <select
              value={resourceForm.unit_id}
              onChange={(e) =>
                setResourceForm({
                  ...resourceForm,
                  unit_id: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="">
                Select unit
              </option>

              {units.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                >
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Type</label>

            <select
              value={resourceForm.type}
              onChange={(e) =>
                setResourceForm({
                  ...resourceForm,
                  type: e.target.value,
                })
              }
              style={selectStyle}
            >
              <option value="video">
                Video
              </option>

              <option value="notes">
                Notes
              </option>
            </select>
          </div>

          <div className="field">
            <label>Title</label>

            <input
              value={resourceForm.title}
              onChange={(e) =>
                setResourceForm({
                  ...resourceForm,
                  title: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label>URL</label>

            <input
              value={resourceForm.url}
              onChange={(e) =>
                setResourceForm({
                  ...resourceForm,
                  url: e.target.value,
                })
              }
            />
          </div>

          <button
            className="btn-primary"
            onClick={() =>
              handleCreate(
                "/resources/",
                resourceForm,
                () =>
                  setResourceForm({
                    ...resourceForm,
                    title: "",
                    url: "",
                  })
              )
            }
          >
            Add resource
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

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