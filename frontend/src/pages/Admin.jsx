import { useEffect, useRef, useState } from "react";
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

const SEMESTERS = Array.from(
  { length: 8 },
  (_, i) => i + 1
);

function Section({ title, hint, children }) {
  return (
    <div
      className="card"
      style={{
        maxWidth: "none",
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginBottom: 4 }}>
        {title}
      </h3>

      {hint && (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          {hint}
        </p>
      )}

      {children}
    </div>
  );
}

/* ============================================================
   MULTI SELECT DROPDOWN
   ============================================================ */

function MultiSelectDropdown({
  label,
  items,
  selected,
  onChange,
  placeholder = "Select...",
  disabled = false,
  getValue = (item) =>
    typeof item === "object"
      ? item.id
      : item,
  getLabel = (item) =>
    typeof item === "object"
      ? item.name
      : `Semester ${item}`,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const values = items.map(getValue);

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(
        selected.filter(
          (current) => current !== value
        )
      );
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = items
    .filter((item) =>
      selected.includes(getValue(item))
    )
    .map(getLabel);

  let displayText = placeholder;

  if (selectedLabels.length === 1) {
    displayText = selectedLabels[0];
  } else if (selectedLabels.length > 1) {
    displayText = `${selectedLabels.length} selected`;
  }

  return (
    <div
      className="field"
      ref={wrapperRef}
      style={{
        position: "relative",
      }}
    >
      <label>{label}</label>

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen((previous) => !previous)
        }
        style={{
          ...selectStyle,
          minHeight: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: disabled
            ? "not-allowed"
            : "pointer",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            color:
              selectedLabels.length > 0
                ? "var(--text)"
                : "var(--text-muted)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            textAlign: "left",
          }}
        >
          {displayText}
        </span>

        <span
          style={{
            flex: "0 0 auto",
            marginLeft: 12,
            fontSize: 12,
            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition:
              "transform 0.15s ease",
          }}
        >
          ▼
        </span>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderBottom:
                "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                onChange(values)
              }
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                background:
                  "rgba(79,142,255,0.10)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={() =>
                onChange([])
              }
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border:
                  "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          </div>

          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              padding: 8,
            }}
          >
            {items.length === 0 ? (
              <div
                style={{
                  padding: "10px 8px",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                None available.
              </div>
            ) : (
              items.map((item) => {
                const value =
                  getValue(item);
                const text =
                  getLabel(item);
                const checked =
                  selected.includes(value);

                return (
                  <div
                    key={String(value)}
                    onClick={() =>
                      toggle(value)
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: checked
                        ? "rgba(79,142,255,0.12)"
                        : "transparent",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggle(value)
                      }
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      style={{
                        width: 18,
                        height: 18,
                        minWidth: 18,
                        minHeight: 18,
                        margin: 0,
                        padding: 0,
                        flex: "0 0 18px",
                        cursor: "pointer",
                        accentColor:
                          "var(--accent-blue)",
                      }}
                    />

                    <span
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        display: "block",
                        color: "var(--text)",
                        fontSize: 13,
                        lineHeight: 1.3,
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ADMIN PAGE
   ============================================================ */

export default function Admin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Navigate
        to="/colleges"
        replace
      />
    );
  }

  const [status, setStatus] =
    useState("");

  return (
    <div className="browse-page">
      <Navbar />

      <div
        className="browse-content"
        style={{ maxWidth: 720 }}
      >
        <span className="eyebrow">
          Admin
        </span>

        <h1 className="display browse-title">
          Add content
        </h1>

        <p className="browse-subtitle">
          Build colleges, branches, semesters,
          subjects and units in bulk, or attach
          resources across branches.
        </p>

        {status && (
          <div
            className="preview-box"
            style={{
              marginBottom: 20,
              whiteSpace: "pre-line",
            }}
          >
            {status}
          </div>
        )}

        <Section
          title="Build academic structure"
          hint="Select multiple values at every level. Stop at any level you need."
        >
          <MasterTreeForm
            notify={setStatus}
          />
        </Section>

        <Section
          title="Attach a single resource"
          hint="Use this when a resource belongs to one specific unit."
        >
          <ResourceForm
            notify={setStatus}
          />
        </Section>

        <Section
          title="Bulk resource attachment"
          hint="Attach the same resource to matching subject + unit combinations across multiple branches and semesters."
        >
          <BulkResourceForm
            notify={setStatus}
          />
        </Section>
      </div>

      <Footer />
    </div>
  );
}

/* ============================================================
   MASTER TREE FORM
   ============================================================ */

function MasterTreeForm({ notify }) {
  const [colleges, setColleges] =
    useState([]);

  const [
    selectedColleges,
    setSelectedColleges,
  ] = useState([]);

  const [newCollegeName, setNewCollegeName] =
    useState("");

  const [
    newCollegeUniversity,
    setNewCollegeUniversity,
  ] = useState("");

  const [branches, setBranches] =
    useState([]);

  const [
    selectedBranches,
    setSelectedBranches,
  ] = useState([]);

  const [
    newBranchNames,
    setNewBranchNames,
  ] = useState("");

  const [
    selectedSemesters,
    setSelectedSemesters,
  ] = useState([]);

  const [
    subjectOptions,
    setSubjectOptions,
  ] = useState([]);

  const [
    selectedSubjectNames,
    setSelectedSubjectNames,
  ] = useState([]);

  const [
    newSubjectNames,
    setNewSubjectNames,
  ] = useState("");

  const [unitNames, setUnitNames] =
    useState("");

  const [running, setRunning] =
    useState(false);

  const loadColleges = async () => {
    try {
      const { data } =
        await client.get(
          "/colleges/"
        );

      setColleges(data);
    } catch (error) {
      notify(
        error.response?.data?.detail ||
          "Failed to load colleges."
      );
    }
  };

  const loadBranches = async () => {
    if (
      selectedColleges.length === 0
    ) {
      setBranches([]);
      setSelectedBranches([]);
      return;
    }

    try {
      const responses =
        await Promise.all(
          selectedColleges.map(
            (collegeId) =>
              client.get(
                `/branches/?college_id=${collegeId}`
              )
          )
        );

      const merged =
        responses.flatMap(
          (response) =>
            response.data
        );

      const unique =
        Array.from(
          new Map(
            merged.map(
              (branch) => [
                branch.id,
                branch,
              ]
            )
          ).values()
        );

      setBranches(unique);

      setSelectedBranches(
        (previous) =>
          previous.filter(
            (id) =>
              unique.some(
                (branch) =>
                  branch.id === id
              )
          )
      );
    } catch (error) {
      notify(
        error.response?.data?.detail ||
          "Failed to load branches."
      );
    }
  };

  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    loadBranches();
  }, [selectedColleges]);

  useEffect(() => {
    if (
      selectedBranches.length === 0 ||
      selectedSemesters.length === 0
    ) {
      setSubjectOptions([]);
      setSelectedSubjectNames([]);
      return;
    }

    const loadSubjects =
      async () => {
        try {
          const requests = [];

          for (
            const branchId of selectedBranches
          ) {
            for (
              const semester of selectedSemesters
            ) {
              requests.push(
                client.get(
                  `/subjects/?branch_id=${branchId}&semester=${semester}`
                )
              );
            }
          }

          const responses =
            await Promise.all(
              requests
            );

          const names =
            responses.flatMap(
              (response) =>
                response.data.map(
                  (subject) =>
                    subject.name.trim()
                )
            );

          const uniqueNames =
            Array.from(
              new Map(
                names.map(
                  (name) => [
                    name.toLowerCase(),
                    name,
                  ]
                )
              ).values()
            );

          setSubjectOptions(
            uniqueNames
          );

          setSelectedSubjectNames(
            (previous) =>
              previous.filter(
                (name) =>
                  uniqueNames.some(
                    (option) =>
                      option.toLowerCase() ===
                      name.toLowerCase()
                  )
              )
          );
        } catch (error) {
          notify(
            error.response?.data?.detail ||
              "Failed to load subjects."
          );
        }
      };

    loadSubjects();
  }, [
    selectedBranches,
    selectedSemesters,
  ]);

  const run = async () => {
    if (running) return;

    const cleanCollegeName =
      newCollegeName.trim();

    const cleanUniversity =
      newCollegeUniversity.trim();

    const newBranches =
      newBranchNames
        .split(",")
        .map(
          (value) => value.trim()
        )
        .filter(Boolean);

    const newSubjects =
      newSubjectNames
        .split(",")
        .map(
          (value) => value.trim()
        )
        .filter(Boolean);

    const units =
      unitNames
        .split("\n")
        .map(
          (value) => value.trim()
        )
        .filter(Boolean);

    const hasCollege =
      selectedColleges.length > 0 ||
      cleanCollegeName.length > 0;

    const hasBranches =
      selectedBranches.length > 0 ||
      newBranches.length > 0;

    const hasSemesters =
      selectedSemesters.length > 0;

    const hasSubjects =
      selectedSubjectNames.length > 0 ||
      newSubjects.length > 0;

    const hasUnits =
      units.length > 0;

    if (
      hasBranches &&
      !hasCollege
    ) {
      notify(
        "Branch needs a college. Select an existing college or create a new one."
      );
      return;
    }

    if (
      hasSemesters &&
      !hasBranches
    ) {
      notify(
        "Semester needs a branch. Select an existing branch or enter new branch names."
      );
      return;
    }

    if (
      hasSubjects &&
      !hasSemesters
    ) {
      notify(
        "Subject needs at least one semester."
      );
      return;
    }

    if (
      hasUnits &&
      !hasSubjects
    ) {
      notify(
        "Units need at least one subject."
      );
      return;
    }

    if (
      !hasCollege &&
      !hasBranches &&
      !hasSemesters &&
      !hasSubjects &&
      !hasUnits
    ) {
      notify(
        "Nothing to do."
      );
      return;
    }

    setRunning(true);

    try {
      const payload = {
        college_ids:
          selectedColleges,

        new_college:
          cleanCollegeName
            ? {
                name:
                  cleanCollegeName,
                university:
                  cleanUniversity,
              }
            : null,

        branch_ids:
          selectedBranches,

        new_branch_names:
          newBranches,

        semesters:
          selectedSemesters,

        subject_ids: [],

        existing_subject_names:
          selectedSubjectNames,

        new_subject_names:
          newSubjects,

        unit_names: units,

        dry_run: false,
      };

      const { data } =
        await client.post(
          "/admin/bulk-structure",
          payload
        );

      const lines = [];

      if (
        data.semesters?.selected
      ) {
        lines.push(
          `Semester scope: ${data.semesters.selected} selected`
        );
      }

      if (
        data.colleges?.created
      ) {
        lines.push(
          `Colleges created: ${data.colleges.created}`
        );
      }

      if (
        data.colleges?.reused
      ) {
        lines.push(
          `Colleges reused: ${data.colleges.reused}`
        );
      }

      if (
        data.branches?.created
      ) {
        lines.push(
          `Branches created: ${data.branches.created}`
        );
      }

      if (
        data.branches?.reused
      ) {
        lines.push(
          `Branches reused: ${data.branches.reused}`
        );
      }

      if (
        data.subjects?.created
      ) {
        lines.push(
          `Subjects created: ${data.subjects.created}`
        );
      }

      if (
        data.subjects?.reused
      ) {
        lines.push(
          `Subjects reused: ${data.subjects.reused}`
        );
      }

      if (
        data.units?.created
      ) {
        lines.push(
          `Units created: ${data.units.created}`
        );
      }

      if (
        data.units?.reused
      ) {
        lines.push(
          `Units reused: ${data.units.reused}`
        );
      }

      notify(
        lines.length > 0
          ? `Done\n${lines.join(
              "\n"
            )}`
          : "Operation completed."
      );

      setNewCollegeName("");
      setNewCollegeUniversity("");
      setNewBranchNames("");
      setNewSubjectNames("");
      setUnitNames("");

      await loadColleges();
    } catch (error) {
      notify(
        error.response?.data?.detail ||
          "Bulk structure operation failed."
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <MultiSelectDropdown
        label="Existing college(s)"
        items={colleges}
        selected={selectedColleges}
        onChange={
          setSelectedColleges
        }
        placeholder="Select college(s)"
      />

      <div className="field">
        <label>
          Or create new college
        </label>

        <input
          value={newCollegeName}
          onChange={(event) =>
            setNewCollegeName(
              event.target.value
            )
          }
          placeholder="College name"
          style={{
            marginBottom: 8,
          }}
        />

        <input
          value={
            newCollegeUniversity
          }
          onChange={(event) =>
            setNewCollegeUniversity(
              event.target.value
            )
          }
          placeholder="University"
        />
      </div>

      <hr className="admin-divider" />

      <MultiSelectDropdown
        label="Existing branch(es)"
        items={branches}
        selected={
          selectedBranches
        }
        onChange={
          setSelectedBranches
        }
        placeholder={
          selectedColleges.length >
          0
            ? "Select branch(es)"
            : "Select college(s) first"
        }
        disabled={
          selectedColleges.length ===
          0
        }
      />

      <div className="field">
        <label>
          Or create new branch(es) —
          comma separated
        </label>

        <input
          value={newBranchNames}
          onChange={(event) =>
            setNewBranchNames(
              event.target.value
            )
          }
          placeholder="CSE, IT, ECE"
        />
      </div>

      <hr className="admin-divider" />

      <MultiSelectDropdown
        label="Semester(s)"
        items={SEMESTERS}
        selected={
          selectedSemesters
        }
        onChange={
          setSelectedSemesters
        }
        placeholder="Select semester(s)"
        disabled={
          selectedBranches.length ===
            0 &&
          !newBranchNames.trim()
        }
      />

      <hr className="admin-divider" />

      <MultiSelectDropdown
        label="Existing subject(s)"
        items={subjectOptions}
        selected={
          selectedSubjectNames
        }
        onChange={
          setSelectedSubjectNames
        }
        placeholder={
          selectedSemesters.length >
          0
            ? "Select subject(s)"
            : "Select semester(s) first"
        }
        disabled={
          selectedBranches.length ===
            0 ||
          selectedSemesters.length ===
            0
        }
        getValue={(item) => item}
        getLabel={(item) => item}
      />

      <div className="field">
        <label>
          Or create new subject(s) —
          comma separated
        </label>

        <input
          value={newSubjectNames}
          onChange={(event) =>
            setNewSubjectNames(
              event.target.value
            )
          }
          placeholder="Data Structures, Applied Maths-I"
        />
      </div>

      <hr className="admin-divider" />

      <div className="field">
        <label>
          Unit names — one per line
        </label>

        <textarea
          value={unitNames}
          onChange={(event) =>
            setUnitNames(
              event.target.value
            )
          }
          rows={5}
          style={{
            ...selectStyle,
            resize: "vertical",
          }}
          placeholder={
            "Introduction\nArrays\nLinked Lists"
          }
        />
      </div>

      <button
        className="btn-primary"
        onClick={run}
        disabled={running}
      >
        {running
          ? "Creating..."
          : "Create / Apply"}
      </button>
    </>
  );
}

/* ============================================================
   SINGLE RESOURCE
   ============================================================ */

function ResourceForm({ notify }) {
  const [colleges, setColleges] =
    useState([]);

  const [collegeId, setCollegeId] =
    useState("");

  const [branches, setBranches] =
    useState([]);

  const [branchId, setBranchId] =
    useState("");

  const [semester, setSemester] =
    useState("");

  const [subjects, setSubjects] =
    useState([]);

  const [subjectId, setSubjectId] =
    useState("");

  const [units, setUnits] =
    useState([]);

  const [unitId, setUnitId] =
    useState("");

  const [type, setType] =
    useState("video");

  const [title, setTitle] =
    useState("");

  const [url, setUrl] =
    useState("");

  useEffect(() => {
    client
      .get("/colleges/")
      .then(({ data }) =>
        setColleges(data)
      );
  }, []);

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setBranchId("");
      return;
    }

    client
      .get(
        `/branches/?college_id=${collegeId}`
      )
      .then(({ data }) =>
        setBranches(data)
      );
  }, [collegeId]);

  useEffect(() => {
    if (!branchId || !semester) {
      setSubjects([]);
      setSubjectId("");
      return;
    }

    client
      .get(
        `/subjects/?branch_id=${branchId}&semester=${semester}`
      )
      .then(({ data }) =>
        setSubjects(data)
      );
  }, [
    branchId,
    semester,
  ]);

  useEffect(() => {
    if (!subjectId) {
      setUnits([]);
      setUnitId("");
      return;
    }

    client
      .get(
        `/units/?subject_id=${subjectId}`
      )
      .then(({ data }) =>
        setUnits(data)
      );
  }, [subjectId]);

  const submit = async () => {
    if (
      !unitId ||
      !title.trim() ||
      !url.trim()
    ) {
      notify(
        "Select a unit and enter title + URL."
      );
      return;
    }

    try {
      await client.post(
        "/resources/",
        {
          unit_id: unitId,
          type,
          title: title.trim(),
          url: url.trim(),
        }
      );

      notify(
        "Resource added."
      );

      setTitle("");
      setUrl("");
    } catch (error) {
      notify(
        error.response?.data?.detail ||
          "Failed to add resource."
      );
    }
  };

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(event) =>
            setCollegeId(
              event.target.value
            )
          }
        >
          <option value="">
            Select college
          </option>

          {colleges.map(
            (college) => (
              <option
                key={college.id}
                value={college.id}
              >
                {college.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="field">
        <label>Branch</label>

        <select
          style={selectStyle}
          value={branchId}
          onChange={(event) =>
            setBranchId(
              event.target.value
            )
          }
          disabled={!collegeId}
        >
          <option value="">
            Select branch
          </option>

          {branches.map(
            (branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="field">
        <label>Semester</label>

        <select
          style={selectStyle}
          value={semester}
          onChange={(event) =>
            setSemester(
              event.target.value
            )
          }
          disabled={!branchId}
        >
          <option value="">
            Select semester
          </option>

          {SEMESTERS.map(
            (number) => (
              <option
                key={number}
                value={number}
              >
                Semester {number}
              </option>
            )
          )}
        </select>
      </div>

      <div className="field">
        <label>Subject</label>

        <select
          style={selectStyle}
          value={subjectId}
          onChange={(event) =>
            setSubjectId(
              event.target.value
            )
          }
          disabled={!semester}
        >
          <option value="">
            Select subject
          </option>

          {subjects.map(
            (subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="field">
        <label>Unit</label>

        <select
          style={selectStyle}
          value={unitId}
          onChange={(event) =>
            setUnitId(
              event.target.value
            )
          }
          disabled={!subjectId}
        >
          <option value="">
            Select unit
          </option>

          {units.map(
            (unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="field">
        <label>Type</label>

        <select
          style={selectStyle}
          value={type}
          onChange={(event) =>
            setType(
              event.target.value
            )
          }
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
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
        />
      </div>

      <div className="field">
        <label>URL</label>

        <input
          value={url}
          onChange={(event) =>
            setUrl(
              event.target.value
            )
          }
        />
      </div>

      <button
        className="btn-primary"
        onClick={submit}
        disabled={
          !unitId ||
          !title.trim() ||
          !url.trim()
        }
      >
        Add resource
      </button>
    </>
  );
}

/* ============================================================
   BULK RESOURCE
   ============================================================ */

function BulkResourceForm({ notify }) {
  const [colleges, setColleges] =
    useState([]);

  const [collegeId, setCollegeId] =
    useState("");

  const [branches, setBranches] =
    useState([]);

  const [
    selectedBranches,
    setSelectedBranches,
  ] = useState([]);

  const [
    selectedSemesters,
    setSelectedSemesters,
  ] = useState([]);

  const [subjectName, setSubjectName] =
    useState("");

  const [unitName, setUnitName] =
    useState("");

  const [type, setType] =
    useState("video");

  const [title, setTitle] =
    useState("");

  const [url, setUrl] =
    useState("");

  useEffect(() => {
    client
      .get("/colleges/")
      .then(({ data }) =>
        setColleges(data)
      );
  }, []);

  useEffect(() => {
    if (!collegeId) {
      setBranches([]);
      setSelectedBranches([]);
      return;
    }

    client
      .get(
        `/branches/?college_id=${collegeId}`
      )
      .then(({ data }) =>
        setBranches(data)
      );
  }, [collegeId]);

  const submit = async () => {
    if (
      !collegeId ||
      selectedBranches.length ===
        0 ||
      selectedSemesters.length ===
        0 ||
      !subjectName.trim() ||
      !unitName.trim() ||
      !title.trim() ||
      !url.trim()
    ) {
      notify(
        "Select college, branches, semesters and enter subject, unit, title and URL."
      );
      return;
    }

    try {
      const { data } =
        await client.post(
          "/admin/bulk-resource",
          {
            branch_ids:
              selectedBranches,
            semesters:
              selectedSemesters,
            subject_name:
              subjectName.trim(),
            unit_name:
              unitName.trim(),
            type,
            title:
              title.trim(),
            url:
              url.trim(),
            dry_run: false,
          }
        );

      notify(
        `Matched units: ${data.matched_units}\n` +
          `Created: ${data.created}\n` +
          `Already attached: ${data.already_attached}`
      );

      setTitle("");
      setUrl("");
    } catch (error) {
      notify(
        error.response?.data?.detail ||
          "Bulk resource operation failed."
      );
    }
  };

  return (
    <>
      <div className="field">
        <label>College</label>

        <select
          style={selectStyle}
          value={collegeId}
          onChange={(event) =>
            setCollegeId(
              event.target.value
            )
          }
        >
          <option value="">
            Select college
          </option>

          {colleges.map(
            (college) => (
              <option
                key={college.id}
                value={college.id}
              >
                {college.name}
              </option>
            )
          )}
        </select>
      </div>

      <MultiSelectDropdown
        label="Branches"
        items={branches}
        selected={
          selectedBranches
        }
        onChange={
          setSelectedBranches
        }
        placeholder={
          collegeId
            ? "Select branch(es)"
            : "Select college first"
        }
        disabled={!collegeId}
      />

      <MultiSelectDropdown
        label="Semester(s)"
        items={SEMESTERS}
        selected={
          selectedSemesters
        }
        onChange={
          setSelectedSemesters
        }
        placeholder="Select semester(s)"
        disabled={!collegeId}
      />

      <div className="field">
        <label>
          Subject name (exact match)
        </label>

        <input
          value={subjectName}
          onChange={(event) =>
            setSubjectName(
              event.target.value
            )
          }
          placeholder="Data Structures"
        />
      </div>

      <div className="field">
        <label>
          Unit name (exact match)
        </label>

        <input
          value={unitName}
          onChange={(event) =>
            setUnitName(
              event.target.value
            )
          }
          placeholder="Arrays"
        />
      </div>

      <div className="field">
        <label>Type</label>

        <select
          style={selectStyle}
          value={type}
          onChange={(event) =>
            setType(
              event.target.value
            )
          }
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
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
        />
      </div>

      <div className="field">
        <label>URL</label>

        <input
          value={url}
          onChange={(event) =>
            setUrl(
              event.target.value
            )
          }
        />
      </div>

      <button
        className="btn-primary"
        onClick={submit}
        disabled={
          !collegeId ||
          selectedBranches.length ===
            0 ||
          selectedSemesters.length ===
            0 ||
          !subjectName.trim() ||
          !unitName.trim() ||
          !title.trim() ||
          !url.trim()
        }
      >
        Attach to matching units
      </button>
    </>
  );
}