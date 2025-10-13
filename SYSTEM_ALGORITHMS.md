# Comprehensive Algorithm Guide for MyCare Health Dashboard

This document provides a detailed breakdown of all major algorithms and logic flows that power the entire MyCare Health dashboard application.

---

## **Algorithm 1: System Architecture**

**Description:** The application is built on a modern, decoupled client-server model, ensuring a clear separation of concerns between the user interface and the core business logic.

1.  **Frontend (Client):** A single-page application (SPA) located in the `/public` directory. It's built with HTML, Tailwind CSS, and vanilla JavaScript. It is responsible for all UI rendering and user interaction. It is initially "dumb" and only becomes active after authenticating with the backend.
2.  **Backend (Server):** A Node.js server using the Express.js framework. It acts as the system's brain, handling API requests, business logic, database operations, and communication with the external Gemini AI service.
3.  **Database:** A cloud-hosted MongoDB Atlas cluster serves as the persistent data store for all application data, including patients, staff, and users. Mongoose is used as the Object Data Modeling (ODM) library to interact with the database.
4.  **AI Service:** The Google Gemini 1.5 Pro model is used for all intelligent automation tasks. All communication with this external API is encapsulated within the `ai.js` module on the backend.

---

## **Algorithm 2: Role-Based Access Control (RBAC) & Authentication**

**Description:** This is a multi-stage algorithm that secures the application by managing user identity, sessions, and permissions.

### **Stage 2.1: User Schema Definition**
**Algorithm:**
1.  Define a `User` schema with three fields: `username` (unique identifier), `password` (for authentication), and `role` (for authorization).
2.  The `role` is strictly limited to 'Admin', 'Doctor', or 'Nurse' using an `enum` to maintain data integrity.

**Code (`models/User.js`):**
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Doctor', 'Nurse'] }
});

module.exports = mongoose.model('User', userSchema);
```

### **Stage 2.2: Secure Password Hashing & Seeding**
**Algorithm:**
1.  During the database seeding process, take a list of default users with plain-text passwords.
2.  For each user, use the `bcrypt.hash()` function to generate a cryptographically secure, salted hash of the password.
3.  Store this hash in the database, **never** the plain-text password.

**Code (`seed.js` snippet):**
```javascript
const bcrypt = require('bcrypt');
const User = require('./models/User');

const saltRounds = 10;
const usersToCreate = [
    { username: 'admin', password: 'password123', role: 'Admin' },
    { username: 'doctor', password: 'password123', role: 'Doctor' },
    { username: 'nurse', password: 'password123', role: 'Nurse' },
];

const users = await Promise.all(
    usersToCreate.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        return { ...user, password: hashedPassword };
    })
);
await User.insertMany(users);
```

### **Stage 2.3: User Login and Session Creation**
**Algorithm:**
1.  The backend provides a `POST /api/auth/login` endpoint.
2.  When a user submits their credentials, find the user in the database by their `username`.
3.  If the user is found, use `bcrypt.compare()` to check if the submitted password, when hashed, matches the stored hash.
4.  If the comparison is successful, initialize a session using the `express-session` middleware and store the user's ID and role in `req.session.user`.
5.  This creates a secure cookie that is sent to the user's browser to identify them in subsequent requests.

**Code (`server.js` snippet):**
```javascript
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = { id: user._id, username: user.username, role: user.role };
    res.json(req.session.user);
});
```

### **Stage 2.4: API Route Protection Middleware**
**Algorithm:**
1.  **Authentication Check (`isAuthenticated`):** Create a middleware that checks for the existence of `req.session.user`. If it doesn't exist, the request is rejected (401 Unauthorized). This is applied to all data-access routes.
2.  **Role Check (`hasRole`):** Create a higher-order middleware that accepts an array of allowed roles (e.g., `['Admin']`). It first checks if the user is authenticated, then checks if `req.session.user.role` is in the allowed array. If not, the request is rejected (403 Forbidden). This is applied to action-performing routes.

**Code (`server.js` snippet):**
```javascript
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized: You must be logged in.' });
    }
    next();
};

const hasRole = (roles) => (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }
    next();
};

// Example of applying the middleware
app.post('/api/staff/generate-schedule', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    // ... logic for Admins only ...
});
```

---

## **Algorithm 3: AI-Powered Automation**

**Description:** These algorithms offload complex decision-making from human users to the Gemini AI, which receives carefully constructed prompts from the backend.

### **Stage 3.1: AI Triage Assignment**
**Algorithm:**
1.  When a new patient is created via the `POST /api/patients` endpoint, the backend receives the patient's complaint and vitals.
2.  It constructs a detailed prompt for the Gemini API, providing the patient's data and defining the 1-5 triage level system.
3.  The backend sends this prompt to the AI and waits for an integer response.
4.  This integer is then saved as the `triageLevel` in the new patient's database record.

**Prompt Template (`ai.js`):**
```
Based on the following patient complaint, assign a triage level from 1 to 5.
- Level 1: Critical (Immediate, life-threatening)
- Level 2: Emergent (Requires care within minutes)
- Level 3: Urgent (Requires care within the hour)
- Level 4: Less Urgent (Can wait a few hours)
- Level 5: Non-Urgent (Can wait for an appointment)

Patient Complaint: "[Patient's Complaint and Vitals]"

Return only the integer triage level (1, 2, 3, 4, or 5).
```

### **Stage 3.2: AI Doctor-Patient Matching**
**Algorithm:**
1.  Immediately after a patient is created, the frontend triggers the `POST /api/patients/:id/assign-doctor` endpoint.
2.  The backend fetches the patient's details and a list of all available doctors, including their specialization and current number of assigned patients (queue).
3.  It constructs a prompt that gives the AI the patient's context and the list of available doctors.
4.  The prompt asks the AI to act as a charge nurse, prioritizing the best specialization first, and then the lightest workload.
5.  The AI returns the name of the single most suitable doctor. The backend then updates the patient and staff records in the database.

**Prompt Template (`ai.js`):**
```
A new patient needs to be assigned to a doctor. Here are the patient's details:
- Patient Complaint: "[Patient's Complaint]"
- Triage Level: [Triage Level] (1=Critical, 5=Non-Urgent)

Here is the list of available doctors, their specializations, and their current number of assigned patients:
- [Doctor 1 Name] (Specialization: [Specialization], Patients: [Queue])
- [Doctor 2 Name] (Specialization: [Specialization], Patients: [Queue])
...

Based on the patient's complaint, the doctors' specializations, and their current workload, which doctor is the most suitable?
Prioritize the best specialization for the complaint, but also consider the doctor with the lightest workload if multiple specialists are available.
Please return only the name of the recommended doctor.
```

### **Stage 3.3: AI Weekly Schedule Generation**
**Algorithm:**
1.  When an Admin user navigates to the scheduling page, the frontend calls the `POST /api/staff/generate-schedule` endpoint.
2.  The backend fetches all doctors and nurses from the database.
3.  It constructs a highly detailed prompt for the AI, providing the list of staff and a strict set of rules for the schedule (3 shifts per day, staffing requirements, balance, and rest days).
4.  The prompt explicitly requests the output in a valid JSON format.
5.  The backend receives this JSON and forwards it directly to the frontend to be rendered into a weekly calendar view.

**Prompt Template (`ai.js`):**
```
Create a 7-day staff schedule for a hospital emergency room.

**Available Staff:**
- Doctors: [List of doctors and their specializations]
- Nurses: [List of nurses]

**Schedule Requirements:**
1.  **Shifts:** There are three 8-hour shifts per day: Morning (7am-3pm), Afternoon (3pm-11pm), and Night (11pm-7am).
2.  **Staffing:** Each shift must have exactly one doctor and one nurse.
3.  **Balance:** Distribute the shifts as evenly as possible among all staff members.
4.  **Rest:** Every staff member must have at least one full day off during the week.
5.  **Fairness:** Avoid scheduling the same person for the night shift too many times in a row.

**Output Format:**
Return the schedule as a valid JSON object only...
```

---

## **Algorithm 4: Frontend Application Flow**

**Description:** This algorithm outlines how the frontend UI initializes and interacts with the backend to create a dynamic user experience.

1.  **Initial Load:** On `DOMContentLoaded`, the `checkSession()` function is called. This sends a request to `/api/auth/session`.
2.  **Authentication Check:**
    *   **If a session exists:** The backend returns the user's data (`username`, `role`). The `initializeApp(user)` function is called.
    *   **If no session exists:** The backend returns a 401 error. The `showLoginPage()` function is called, ensuring the main application remains hidden.
3.  **Application Initialization (`initializeApp`):**
    *   The login page is hidden, and the main application container is displayed.
    *   The user's information is used to populate the UI (e.g., the user's name in the header).
    *   **RBAC in UI:** The user's `role` is used to dynamically show or hide elements. The code iterates through all elements with a `data-role` attribute and hides those that do not match the user's role (e.g., hiding the 'Staff Scheduling' link for a 'Nurse').
    *   Initial data-fetching functions (`loadDashboardData()`) are called to populate the dashboard with real-time information.
4.  **User Interaction:**
    *   When a user performs an action (e.g., adding a patient), the frontend sends a protected API request to the backend.
    *   Because the user is logged in, their session cookie is automatically sent with the request, allowing the backend's `isAuthenticated` and `hasRole` middleware to authorize the action.
    *   Upon receiving a successful response, the frontend updates the relevant parts of the UI.
5.  **Logout:** Clicking the logout button calls the `handleLogout()` function, which sends a request to `/api/auth/logout`, clears the session, and redirects the user back to the login page.