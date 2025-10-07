# MyCare Health Dashboard

This is a web-based dashboard for managing hospital operations, including patient triage, bed management, and staff scheduling. The application uses a Node.js backend with Express and a static frontend built with HTML, CSS, and JavaScript. It also integrates with the Gemini API for AI-powered features like patient triage and staff scheduling.

## Features

- **Dashboard Overview:** View key metrics like total patients, bed occupancy, and average wait times.
- **Triage & Queue:** Manage incoming patients with an AI-assisted triage system.
- **Bed Management:** View the status of all hospital beds.
- **Staff Scheduling:** Manage staff schedules with an AI-powered weekly schedule generator.
- **Patient Portal:** A portal for patients to access information (future development).
- **Forecasting:** View patient arrival and admission forecasts (future development).

## Project Structure

- `public/`: Contains all the static frontend files.
  - `css/`: CSS stylesheets.
  - `js/`: JavaScript files.
  - `index.html`: The main HTML file.
- `ai.js`: A module for interacting with the Gemini API.
- `server.js`: The main Express server file.
- `package.json`: Project dependencies and scripts.
- `README.md`: This file.

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Gokul-Eswar/healthcare.git
cd healthcare
```

### 2. Install Dependencies

Install the necessary Node.js packages using npm:

```bash
npm install
```

### 3. Configure Environment Variables

This project requires a Gemini API key to use the AI-powered features. You need to set this key as an environment variable.

1.  **Get a Gemini API Key:** If you don't have one, you can get a key from the [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Set the Environment Variable:** You can set the environment variable in your terminal session or by using a `.env` file.

    **For the current terminal session:**

    -   On macOS and Linux:
        ```bash
        export GEMINI_API_KEY="YOUR_API_KEY"
        ```
    -   On Windows (Command Prompt):
        ```bash
        set GEMINI_API_KEY="YOUR_API_KEY"
        ```
    -   On Windows (PowerShell):
        ```powershell
        $env:GEMINI_API_KEY="YOUR_API_KEY"
        ```

    **Using a `.env` file (recommended for local development):**

    1.  Create a file named `.env` in the root of the project.
    2.  Add the following line to the `.env` file, replacing `YOUR_API_KEY` with your actual key:
        ```
        GEMINI_API_KEY="YOUR_API_KEY"
        ```
    3.  To load the environment variables from the `.env` file, you'll need to install the `dotenv` package:
        ```bash
        npm install dotenv
        ```
    4.  Then, add the following line to the top of `server.js`:
        ```javascript
        require('dotenv').config();
        ```

### 4. Run the Application

Once you have installed the dependencies and configured the environment variables, you can start the server:

```bash
npm start
```

The application will be running at [http://localhost:3000](http://localhost:3000).

## How to Use

- **Add a Patient:** Navigate to the "Triage & Queue" page and click the "Add Patient" button. Fill out the form and submit it. The patient will be added to the "Awaiting Triage" column with an AI-generated triage level.
- **Generate a Schedule:** Navigate to the "Staff Scheduling" page and click the "Generate AI Schedule" button. A new weekly schedule will be generated and displayed.
- **Add Staff:** On the "Staff Scheduling" page, click the "Add Staff" button to manually add a new staff member to the list. This new staff member will be considered when generating the next AI schedule.