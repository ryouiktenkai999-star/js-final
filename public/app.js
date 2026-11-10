const tableBody = document.getElementById("studentTable");
const modalBackdrop = document.getElementById("modalBackdrop");
const studentForm = document.getElementById("studentForm");
const formError = document.getElementById("formError");
const searchInput = document.getElementById("searchInput");
let editingId = null;
let searchTimer;

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function initials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}

async function loadStudents(search = "") {
  try {
    const students = await api(`/api/students?search=${encodeURIComponent(search)}`);
    document.getElementById("recordCount").textContent = `${students.length} record${students.length === 1 ? "" : "s"}`;
    if (!students.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="empty">No student records found. Add a student to get started.</td></tr>';
      return;
    }
    tableBody.innerHTML = students.map(student => `
      <tr>
        <td><div class="student-cell"><div class="student-avatar">${escapeHTML(initials(student.full_name))}</div><div><div class="student-name">${escapeHTML(student.full_name)}</div><div class="student-email">${escapeHTML(student.email)}</div></div></div></td>
        <td>${escapeHTML(student.student_id)}</td>
        <td class="course-cell" title="${escapeHTML(student.course)}">${escapeHTML(student.course)}</td>
        <td><span class="year-pill">${escapeHTML(student.year_level)}</span></td>
        <td><div class="actions"><button class="action-btn" data-action="edit" data-id="${student.id}">Edit</button><button class="action-btn delete" data-action="delete" data-id="${student.id}">Delete</button></div></td>
      </tr>`).join("");
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHTML(error.message)}</td></tr>`;
  }
}

async function loadStats() {
  try {
    const stats = await api("/api/stats");
    document.getElementById("totalStudents").textContent = stats.total;
    document.getElementById("totalCourses").textContent = stats.courses;
    document.getElementById("commonYear").textContent = stats.mostCommonYear;
  } catch (error) { showToast(error.message); }
}

async function refreshDashboard(search = "") {
  await Promise.all([loadStudents(search), loadStats()]);
}

function openModal(student = null) {
  editingId = student ? student.id : null;
  studentForm.reset();
  formError.textContent = "";
  document.getElementById("modalTitle").textContent = student ? "Edit student" : "Add new student";
  document.getElementById("saveBtn").textContent = student ? "Update student" : "Save student";
  if (student) {
    for (const field of ["student_id", "full_name", "email", "course", "year_level"]) {
      studentForm.elements[field].value = student[field];
    }
  }
  modalBackdrop.classList.remove("hidden");
  studentForm.elements.student_id.focus();
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  editingId = null;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.getElementById("addStudent").addEventListener("click", () => openModal());
document.getElementById("addStudentTop").addEventListener("click", () => openModal());
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

studentForm.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";
  const body = Object.fromEntries(new FormData(studentForm).entries());
  const wasEditing = Boolean(editingId);
  const currentId = editingId;
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  try {
    await api(wasEditing ? `/api/students/${currentId}` : "/api/students", {
      method: wasEditing ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    closeModal();
    await refreshDashboard(searchInput.value.trim());
    showToast(wasEditing ? "Student updated successfully." : "Student added successfully.");
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = wasEditing ? "Update student" : "Save student";
  }
});

tableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    try {
      const students = await api("/api/students");
      const student = students.find(item => item.id === id);
      if (student) openModal(student);
    } catch (error) { showToast(error.message); }
  } else if (button.dataset.action === "delete") {
    if (!confirm("Are you sure you want to delete this student record?")) return;
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      await refreshDashboard(searchInput.value.trim());
      showToast("Student deleted successfully.");
    } catch (error) { showToast(error.message); }
  }
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadStudents(searchInput.value.trim()), 250);
});

refreshDashboard();
