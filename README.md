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
- `ai.js`: A module for interacting with the Gemini API.
- `server.js`: The main Express server file.
- `package.json`: Project dependencies and scripts.
- `.env.example`: An example file for the required environment variables.
- `setup.sh`: An automated setup script.
- `README.md`: This file.

## Quick Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- `bash` (for running the setup script on Linux, macOS, or Windows with WSL)

### 1. Clone the Repository

```bash
git clone https://github.com/Gokul-Eswar/healthcare.git
cd healthcare
```

### 2. Run the Setup Script

This script will install all the necessary dependencies and create a `.env` file for you from the example template.

```bash
bash setup.sh
```

### 3. Configure Your API Key

The setup script will create a `.env` file in the root of the project. Open this file and add your Gemini API key:

- `GEMINI_API_KEY`: Your API key for the Gemini service.

You can get a key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run the Application

Once you have configured your `.env` file, you can start the server:

```bash
npm start
```

The application will be running at [http://localhost:3000](http://localhost:3000).

## How to Use

- **Add a Patient:** Navigate to the "Triage & Queue" page and click the "Add Patient" button. The patient will be added to the queue with an AI-generated triage level.
- **View the Schedule:** Navigate to the "Staff Scheduling" page to see the automatically generated weekly schedule.
- **Add Staff:** On the "Staff Scheduling" page, you can also manually add new staff members who will be included in future AI-generated schedules.