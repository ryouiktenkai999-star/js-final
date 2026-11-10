# Student Management Dashboard

A beginner-friendly CRUD dashboard built with HTML, CSS, JavaScript, Express.js, and SQLite.

## Features
- Dashboard statistics
- Add student records (Create)
- View student records (Read)
- Edit student records (Update)
- Delete student records (Delete)
- Search by student ID, name, email, or course
- SQLite database that saves records locally
- Responsive layout for desktop and mobile
- Sample student records on first launch

## Requirements
- Node.js (LTS recommended)
- npm (installed with Node.js)

## Installation and running

1. Extract this project ZIP.
2. Open the extracted `student-management-dashboard` folder in VS Code.
3. Open the VS Code terminal: **Terminal > New Terminal**.
4. Install the dependencies:

   ```bash
   npm install
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open this address in your browser:

   http://localhost:3000

Keep the terminal running while using the dashboard. Press `Ctrl + C` in the terminal to stop the server.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | Get all students |
| GET | `/api/students?search=alex` | Search students |
| GET | `/api/stats` | Get dashboard statistics |
| POST | `/api/students` | Add a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

## Database
SQLite automatically creates `students.db` in the project folder the first time the server starts. The database file is ignored by Git because it is generated locally.

## Upload to GitHub

Create a **public** repository on GitHub. Then run these commands in the VS Code terminal from this project folder (replace the URL with your own repository URL):

```bash
git init
git add .
git commit -m "Create student management dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Do not upload `node_modules` or the local database file. The `.gitignore` file already excludes them.

## Demonstration checklist
1. Start the server and open the dashboard.
2. Show the dashboard statistics.
3. Add a new student.
4. Search for the student you added.
5. Edit the student's details.
6. Delete the student and show the updated total.
7. Explain that Express.js handles API requests and SQLite stores the records.
