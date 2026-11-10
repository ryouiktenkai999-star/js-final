const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new DatabaseSync(path.join(__dirname, "students.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    year_level TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const count = db.prepare("SELECT COUNT(*) AS total FROM students").get().total;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO students (student_id, full_name, email, course, year_level)
    VALUES (?, ?, ?, ?, ?)
  `);
  const sampleStudents = [
    ["2026-0001", "Alex Santos", "alex@example.com", "BS Information Technology", "1st Year"],
    ["2026-0002", "Jamie Cruz", "jamie@example.com", "BS Computer Science", "2nd Year"],
    ["2026-0003", "Taylor Reyes", "taylor@example.com", "BS Information Technology", "3rd Year"]
  ];
  for (const student of sampleStudents) {
    insert.run(...student);
  }
}

function validateStudent(body) {
  const fields = ["student_id", "full_name", "email", "course", "year_level"];
  for (const field of fields) {
    if (!body[field] || !String(body[field]).trim()) {
      return `${field.replace("_", " ")} is required.`;
    }
  }
  const email = String(body.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

// READ all students (optional search)
app.get("/api/students", (req, res) => {
  const search = String(req.query.search || "").trim();
  const rows = search
    ? db.prepare(`
        SELECT * FROM students
        WHERE student_id LIKE ? OR full_name LIKE ? OR email LIKE ? OR course LIKE ?
        ORDER BY id DESC
      `).all(...Array(4).fill(`%${search}%`))
    : db.prepare("SELECT * FROM students ORDER BY id DESC").all();
  res.json(rows);
});

// Dashboard summary
app.get("/api/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS count FROM students").get().count;
  const courses = db.prepare("SELECT COUNT(DISTINCT course) AS count FROM students").get().count;
  const year = db.prepare("SELECT year_level, COUNT(*) AS count FROM students GROUP BY year_level ORDER BY count DESC LIMIT 1").get();
  res.json({ total, courses, mostCommonYear: year ? year.year_level : "—" });
});

// CREATE a student
app.post("/api/students", (req, res) => {
  const error = validateStudent(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const result = db.prepare(`
      INSERT INTO students (student_id, full_name, email, course, year_level)
      VALUES (@student_id, @full_name, @email, @course, @year_level)
    `).run({
      student_id: req.body.student_id.trim(),
      full_name: req.body.full_name.trim(),
      email: req.body.email.trim(),
      course: req.body.course.trim(),
      year_level: req.body.year_level
    });
    res.status(201).json(db.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid));
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "That student ID already exists." });
    }
    res.status(500).json({ error: "Could not save student." });
  }
});

// UPDATE a student
app.put("/api/students/:id", (req, res) => {
  const error = validateStudent(req.body);
  if (error) return res.status(400).json({ error });
  const result = db.prepare(`
    UPDATE students
    SET student_id = @student_id, full_name = @full_name, email = @email,
        course = @course, year_level = @year_level
    WHERE id = @id
  `).run({
    id: Number(req.params.id),
    student_id: req.body.student_id.trim(),
    full_name: req.body.full_name.trim(),
    email: req.body.email.trim(),
    course: req.body.course.trim(),
    year_level: req.body.year_level
  });
  if (!result.changes) return res.status(404).json({ error: "Student not found." });
  res.json(db.prepare("SELECT * FROM students WHERE id = ?").get(Number(req.params.id)));
});

// DELETE a student
app.delete("/api/students/:id", (req, res) => {
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: "Student not found." });
  res.json({ message: "Student deleted successfully." });
});

app.listen(PORT, () => {
  console.log(`Student Dashboard is running at http://localhost:${PORT}`);
});
