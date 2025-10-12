# MyCare Health Dashboard - Technical Workflow and Logic

This document provides a detailed, granular explanation of the entire workflow of the MyCare Health dashboard, including the application architecture, logic flow, and the AI algorithms used for automation.

## 1. Application Architecture

The application is a full-stack web application built with a client-server model.

-   **Frontend:** A static single-page application (SPA) located in the `public/` directory. It is built with HTML, CSS (Tailwind CSS), and vanilla JavaScript. The frontend is responsible for rendering the user interface and communicating with the backend via API calls.
-   **Backend:** A Node.js server using the Express.js framework. The backend handles all the business logic, including serving the frontend, managing the database, and integrating with the Gemini AI.
-   **Database:** A MongoDB Atlas cluster is used for persistent data storage. The application connects to the database using Mongoose, an Object Data Modeling (ODM) library for MongoDB and Node.js.
-   **AI Integration:** The Gemini 1.5 Pro model is used for all AI-powered features. The `ai.js` module encapsulates all interactions with the Gemini API.

## 2. AI-Powered Triage

When a new patient is added to the system, they are automatically assigned a triage level by the AI.

**Logic Flow:**

1.  **User Action:** The user clicks the "Add Patient" button, fills out the form, and submits it.
2.  **Frontend:** The frontend JavaScript (`public/js/script.js`) captures the form data and sends a `POST` request to the `/api/patients` endpoint.
3.  **Backend (`server.js`):**
    *   The `/api/patients` endpoint receives the request.
    *   It calls the `getTriageLevel` function from the `ai.js` module, passing the patient's complaint and vitals.
4.  **AI Module (`ai.js`):**
    *   The `getTriageLevel` function constructs a detailed prompt for the Gemini API.
    *   **Prompt:**
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
    *   The function sends this prompt to the Gemini API and returns the integer response (e.g., `3`).
5.  **Backend (`server.js`):**
    *   The backend receives the triage level from the AI.
    *   It creates a new patient record in the MongoDB database with the AI-generated triage level and a status of `awaiting-triage`.
6.  **Frontend:** The frontend automatically refreshes the "Awaiting Triage" column to display the new patient with their assigned triage level and color-coded severity.

## 3. Automated Doctor-Patient Matching

Immediately after a patient is added and triaged, the system automatically assigns the most suitable doctor.

**Logic Flow:**

1.  **Frontend (`public/js/script.js`):**
    *   After the `/api/patients` request is successful, the frontend immediately sends a `POST` request to the `/api/patients/:id/assign-doctor` endpoint, using the ID of the newly created patient.
2.  **Backend (`server.js`):**
    *   The `/api/patients/:id/assign-doctor` endpoint receives the request.
    *   It fetches the patient's details and a list of all available doctors from the database.
    *   It then calls the `getDoctorForPatient` function from the `ai.js` module.
3.  **AI Module (`ai.js`):**
    *   The `getDoctorForPatient` function constructs a prompt for the Gemini API with the patient's complaint, triage level, and a list of available doctors with their specializations and current patient loads.
    *   **Prompt:**
        ```
        A new patient needs to be assigned to a doctor. Here are the patient's details:
        - Patient Complaint: "[Patient's Complaint]"
        - Triage Level: [Triage Level] (1=Critical, 5=Non-Urgent)

        Here is the list of available doctors, their specializations, and their current number of assigned patients:
        - [Doctor Name] (Specialization: [Specialization], Patients: [Queue])
        - [Doctor Name] (Specialization: [Specialization], Patients: [Queue])
        ...

        Based on the patient's complaint, the doctors' specializations, and their current workload, which doctor is the most suitable?
        Prioritize the best specialization for the complaint, but also consider the doctor with the lightest workload if multiple specialists are available.
        Please return only the name of the recommended doctor.
        ```
    *   The function sends this prompt to the Gemini API and returns the name of the recommended doctor.
4.  **Backend (`server.js`):**
    *   The backend receives the recommended doctor's name.
    *   It updates the patient's status to `awaiting-bed` and assigns the recommended doctor to them in the database.
    *   It also increments the `queue` count for the assigned doctor.
5.  **Frontend:** The frontend automatically refreshes the "Awaiting Triage" and "Awaiting Bed" columns to reflect the new patient assignment.

## 4. Automated Staff Scheduling

The weekly staff schedule is automatically generated by the AI when a user navigates to the "Staff Scheduling" page.

**Logic Flow:**

1.  **User Action:** The user clicks on the "Staff Scheduling" link in the navigation menu.
2.  **Frontend (`public/js/script.js`):**
    *   The `switchPage` function detects that the user is navigating to the scheduling page.
    *   It calls the `generateAndRenderWeeklySchedule` function.
3.  **Frontend (`public/js/script.js`):**
    *   The `generateAndRenderWeeklySchedule` function sends a `POST` request to the `/api/staff/generate-schedule` endpoint.
4.  **Backend (`server.js`):**
    *   The `/api/staff/generate-schedule` endpoint fetches all doctors and nurses from the database.
    *   It calls the `generateWeeklySchedule` function from the `ai.js` module, passing the lists of doctors and nurses.
5.  **AI Module (`ai.js`):**
    *   The `generateWeeklySchedule` function constructs a detailed prompt for the Gemini API.
    *   **Prompt:**
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
    *   The function sends this prompt to the Gemini API and returns a JSON object representing the full weekly schedule.
6.  **Frontend:** The frontend receives the schedule and uses the `renderWeeklySchedule` function to display it in a clear, day-by-day format.

## 5. Project Evolution

This project has undergone several iterations to become a robust, full-stack application.

*   **Initial Setup and Refactoring:**
    *   The project began as a single HTML file and was refactored into a structured application with separate files for HTML, CSS, and JavaScript.
    *   A `public` directory was established to hold all static assets.

*   **Backend and Database:**
    *   A Node.js backend with the Express.js framework was created to serve the frontend and provide a REST API.
    *   The application's data storage evolved from an in-memory solution to a persistent SQLite database, and finally to a scalable MongoDB Atlas cluster.
    *   Mongoose was integrated to manage the MongoDB connection and data models.
    *   The backend now includes a `database.js` file for database configuration and a `seed.js` script to populate the database with initial data.
    *   All API endpoints have been updated to use the MongoDB database.

*   **AI Integration:**
    *   The AI model was upgraded from `gemini-1.5-flash` to `gemini-1.5-pro` to enhance the application's intelligence.

*   **Authentication:**
    *   A Google OAuth 2.0 authentication system using Passport.js and `express-session` was implemented and later removed at the user's request to simplify the application.

*   **Frontend:**
    *   The frontend has been updated to be fully dynamic, fetching all data from the backend API.
    *   The dashboard charts are now dynamic, sourcing data from a new time-series API endpoint.
    *   The UI has been polished to remove non-functional elements and improve the user experience.

*   **Project Setup and Documentation:**
    *   A comprehensive `README.md` file with detailed setup instructions has been created.
    *   A `setup.sh` script has been added to automate the project setup process.
    *   An `.env.example` file is included to specify the required environment variables.
    *   All sensitive information, such as API keys and database connection strings, is handled securely using environment variables and is not hardcoded in the source code.